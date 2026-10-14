import { ratingDelta, snapshotLoadout } from './arena.ts';
import { enemyCombatant, fleeChance, GameError, playRound, validatePlan } from './combat.ts';
import { getEnemy } from './content/enemies.ts';
import { getItem } from './content/items.ts';
import { getSettlement, getZone, START_LOCATION, travelDistance } from './content/locations.ts';
import { getPerk } from './content/perks.ts';
import { getQuest, QUESTS, type Quest } from './content/quests.ts';
import { clamp, randInt, roll, weightedPick } from './rng.ts';
import {
  combatantFromLoadout,
  emptyParts,
  equippedWeapon,
  hasPerk,
  healingRate,
  isOverweight,
  maxHp,
  playerLoadout,
  radResistance,
  SKILL_KEYS,
  skillPointsPerLevel,
  skillValue,
  START_STAT_POINTS,
  STAT_KEYS,
  STAT_MAX,
  STAT_MIN,
  xpForLevel,
} from './stats.ts';
import type {
  ActionResult,
  ArenaSnapshot,
  CombatKind,
  CombatResult,
  CombatState,
  Combatant,
  EngineContext,
  EnemyId,
  Equipment,
  GameState,
  ItemId,
  LocationId,
  LootEntry,
  PerkId,
  Player,
  QuestId,
  SkillKey,
  Skills,
  StatKey,
  Stats,
  Toast,
  TurnAction,
} from './types.ts';

/** Состояние — чистый JSON, так что копия через сериализацию безопасна. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type PlayerAction =
  | { type: 'create'; name: string; stats: Stats; perk: PerkId; look: Player['look'] }
  | { type: 'travel'; to: LocationId }
  | { type: 'enterZone'; zone: LocationId }
  | { type: 'explore' }
  | { type: 'leaveZone' }
  | { type: 'combatTurn'; actions: TurnAction[] }
  | { type: 'flee' }
  | { type: 'finishCombat' }
  | { type: 'useItem'; item: ItemId }
  | { type: 'equip'; item: ItemId }
  | { type: 'unequip'; slot: keyof Equipment }
  | { type: 'drop'; item: ItemId; count: number }
  | { type: 'buy'; item: ItemId; count: number }
  | { type: 'sell'; item: ItemId; count: number }
  | { type: 'rest' }
  | { type: 'acceptQuest'; quest: QuestId }
  | { type: 'completeQuest'; quest: QuestId }
  | { type: 'allocate'; skills: Partial<Skills>; stats: Partial<Stats> }
  | { type: 'pickPerk'; perk: PerkId }
  | { type: 'arenaFight'; opponent: ArenaSnapshot };

export function newGame(now: number): GameState {
  return {
    version: 1,
    player: null,
    location: START_LOCATION,
    expedition: null,
    combat: null,
    quests: {},
    kills: {},
    arena: { rating: 1000, wins: 0, losses: 0 },
    journal: [],
    updatedAt: now,
  };
}

// ── Цены ──

export function buyPrice(item: ItemId, barter: number): number {
  const mult = clamp(1.6 - barter / 200, 1.1, 1.6);
  return Math.max(1, Math.ceil(getItem(item).value * mult));
}

export function sellPrice(item: ItemId, barter: number): number {
  const mult = clamp(0.3 + barter / 400, 0.3, 0.6);
  return Math.floor(getItem(item).value * mult);
}

// ── Квесты ──

export type QuestView = Quest & { progress: number; status: 'locked' | 'available' | 'active' | 'done' | 'rewarded' };

export function questProgress(state: GameState, quest: Quest): number {
  if (quest.goal.kind === 'kill') return state.quests[quest.id]?.count ?? 0;
  return Math.min(quest.goal.count, state.player?.inventory[quest.goal.item] ?? 0);
}

export function questView(state: GameState, quest: Quest): QuestView {
  const progress = questProgress(state, quest);
  const record = state.quests[quest.id];
  const level = state.player?.level ?? 1;
  let status: QuestView['status'];
  if (record?.status === 'rewarded') status = 'rewarded';
  else if (record) status = progress >= quest.goal.count ? 'done' : 'active';
  else if (level < quest.minLevel || (quest.requires && state.quests[quest.requires]?.status !== 'rewarded')) status = 'locked';
  else status = 'available';
  return { ...quest, progress, status };
}

export const allQuestViews = (state: GameState): QuestView[] => Object.values(QUESTS).map((q) => questView(state, q));

// ── Внутренние помощники ──

function requirePlayer(state: GameState): Player {
  if (!state.player) throw new GameError('Сначала создай персонажа');
  return state.player;
}

function requireIdle(state: GameState): Player {
  const p = requirePlayer(state);
  if (state.combat) throw new GameError('Сейчас идёт бой!');
  return p;
}

function requireSettlement(state: GameState): Player {
  const p = requireIdle(state);
  if (state.expedition) throw new GameError('Сначала вернись в поселение');
  return p;
}

function addItem(p: Player, item: ItemId, count: number): void {
  getItem(item);
  p.inventory[item] = (p.inventory[item] ?? 0) + count;
}

function removeItem(p: Player, item: ItemId, count: number): void {
  const have = p.inventory[item] ?? 0;
  if (have < count) throw new GameError(`Не хватает: ${getItem(item).name}`);
  if (have === count) {
    delete p.inventory[item];
    for (const slot of ['weapon', 'body', 'head'] as const) if (p.equipment[slot] === item) p.equipment[slot] = null;
  } else {
    p.inventory[item] = have - count;
  }
}

function rollLoot(entries: LootEntry[], ctx: EngineContext, bonusRolls: number): Record<ItemId, number> {
  const loot: Record<ItemId, number> = {};
  for (let i = 0; i <= bonusRolls; i++) {
    for (const e of entries) {
      if (roll(ctx.rng, e.chance)) loot[e.item] = (loot[e.item] ?? 0) + randInt(ctx.rng, e.min ?? 1, e.max ?? 1);
    }
  }
  return loot;
}

function lootText(loot: Record<ItemId, number>): string {
  return Object.entries(loot)
    .map(([id, n]) => (n > 1 ? `${getItem(id).name} ×${n}` : getItem(id).name))
    .join(', ');
}

function grantXp(p: Player, amount: number, toasts: Toast[]): boolean {
  p.xp += amount;
  let leveled = false;
  while (p.xp >= xpForLevel(p.level + 1)) {
    p.level++;
    leveled = true;
    p.unspentSkillPoints += skillPointsPerLevel(p.stats);
    if (p.level % 3 === 0) p.unspentPerks++;
    if (p.level % 4 === 0) p.unspentStatPoints++;
    toasts.push({ text: `Новый уровень: ${p.level}!`, tone: 'level' });
  }
  if (leveled) p.hp = maxHp(p);
  return leveled;
}

function journal(state: GameState, text: string): void {
  state.journal = [text, ...state.journal].slice(0, 40);
}

function healMult(p: Player): number {
  return 1 + skillValue(p.stats, p.skills, 'medicine') / 100;
}

function applyRads(p: Player, amount: number): number {
  const taken = Math.round(amount * (1 - radResistance(p) / 100));
  p.rads = clamp(p.rads + taken, 0, 1000);
  p.hp = Math.min(p.hp, maxHp(p));
  return taken;
}

// ── Бой ──

function startCombat(state: GameState, kind: CombatKind, enemy: Combatant, template: EnemyId | null, opponentId?: string): void {
  state.combat = {
    kind,
    round: 0,
    enemyTemplate: template,
    opponentId,
    enemy,
    playerParts: emptyParts(),
    lastRound: [],
    log: [`На вас нападает ${enemy.name}!`],
    result: null,
  };
}

export function playerCombatant(state: GameState): Combatant {
  const p = requirePlayer(state);
  return combatantFromLoadout(playerLoadout(p), state.combat?.playerParts ?? emptyParts());
}

function trackKill(state: GameState, enemy: EnemyId): void {
  state.kills[enemy] = (state.kills[enemy] ?? 0) + 1;
  for (const q of Object.values(QUESTS)) {
    const rec = state.quests[q.id];
    if (rec?.status === 'active' && q.goal.kind === 'kill' && q.goal.enemy === enemy) rec.count = Math.min(q.goal.count, rec.count + 1);
  }
}

function finishRound(state: GameState, combat: CombatState, enemy: Combatant, player: Combatant, ctx: EngineContext, toasts: Toast[]): void {
  const p = requirePlayer(state);
  p.hp = player.hp;
  combat.enemy = enemy;
  combat.playerParts = player.parts;

  if (enemy.hp <= 0) {
    const death = [...combat.lastRound].reverse().find((e) => e.kind === 'attack' && e.death);
    const result: CombatResult = { outcome: 'win', xp: 0, caps: 0, loot: {}, levelUp: false, deathKind: death?.kind === 'attack' ? death.death : 'collapse' };
    if (combat.kind === 'arena') {
      const delta = ratingDelta(state.arena.rating, enemyRating(combat), true);
      state.arena.rating += delta;
      state.arena.wins++;
      result.rating = delta;
      result.xp = 15 + enemy.level * 12;
      result.caps = 10 + enemy.level * 8;
    } else if (combat.enemyTemplate) {
      const t = getEnemy(combat.enemyTemplate);
      result.xp = t.xp;
      result.caps = randInt(ctx.rng, t.caps[0], t.caps[1]);
      result.loot = rollLoot(t.loot, ctx, hasPerk(p.perks, 'scrounger') ? 1 : 0);
      trackKill(state, t.id);
      if (t.boss && state.expedition) {
        state.expedition.bossDefeated = true;
        state.expedition.lastEvent = { kind: 'cleared', text: `${t.name} повержен. Локация зачищена — можно возвращаться.` };
      }
    }
    p.caps += result.caps;
    for (const [id, n] of Object.entries(result.loot)) addItem(p, id, n);
    result.levelUp = grantXp(p, result.xp, toasts);
    combat.result = result;
    journal(state, `Победа над «${enemy.name}». +${result.xp} опыта.`);
  } else if (player.hp <= 0) {
    const result: CombatResult = { outcome: 'lose', xp: 0, caps: 0, loot: {}, levelUp: false };
    if (combat.kind === 'arena') {
      const delta = ratingDelta(state.arena.rating, enemyRating(combat), false);
      state.arena.rating += delta;
      state.arena.losses++;
      result.rating = delta;
    } else {
      result.caps = -Math.floor(p.caps * 0.15);
      p.caps += result.caps;
    }
    p.hp = 1;
    combat.result = result;
    journal(state, `Поражение от «${enemy.name}».`);
  }
}

function enemyRating(combat: CombatState): number {
  return combat.opponentRating ?? 1000 + combat.enemy.level * 25;
}

function combatTurn(state: GameState, actions: TurnAction[] | null, ctx: EngineContext, toasts: Toast[]): void {
  const combat = state.combat;
  if (!combat) throw new GameError('Боя нет');
  if (combat.result) throw new GameError('Бой окончен');
  const p = requirePlayer(state);
  const player = playerCombatant(state);
  if (actions) validatePlan(player, actions);
  const enemy: Combatant = clone(combat.enemy);

  const ammo = equippedWeapon(p.equipment).ammo;
  const outcome = playRound(player, enemy, actions, ctx.rng, {
    spendAmmo: () => {
      if (!ammo || player.weapon.ammo !== ammo) return true;
      if ((p.inventory[ammo] ?? 0) <= 0) return false;
      removeItem(p, ammo, 1);
      return true;
    },
    consumeItem: (item) => {
      const it = getItem(item);
      if (it.type !== 'consumable' || (p.inventory[item] ?? 0) <= 0) return null;
      removeItem(p, item, 1);
      return it.effect;
    },
    healMult: healMult(p),
  });
  combat.round++;
  combat.lastRound = outcome.events;
  combat.log = [...outcome.log.reverse(), ...combat.log].slice(0, 30);
  finishRound(state, combat, enemy, player, ctx, toasts);
}

// ── Экспедиции ──

function exploreStep(state: GameState, ctx: EngineContext, toasts: Toast[]): void {
  const p = requireIdle(state);
  const exp = state.expedition;
  if (!exp) throw new GameError('Ты не в экспедиции');
  if (exp.bossDefeated) throw new GameError('Здесь больше никого нет. Возвращайся в поселение.');
  if (isOverweight(p)) throw new GameError('Перегруз! Избавься от лишнего, чтобы идти дальше.');
  const zone = getZone(exp.zone);
  exp.depth++;
  const rads = applyRads(p, zone.radPerStep);
  if (rads > 0) toasts.push({ text: `+${rads} рад`, tone: 'bad' });

  if (exp.depth >= zone.depth) {
    const boss = getEnemy(zone.boss);
    exp.lastEvent = { kind: 'boss', text: `Логово. Перед тобой — ${boss.name}. ${boss.description}` };
    startCombat(state, 'boss', enemyCombatant(boss), boss.id);
    return;
  }

  const survival = skillValue(p.stats, p.skills, 'survival');
  const event = weightedPick(ctx.rng, [
    ['fight', 55],
    ['cache', 18 + Math.floor(p.stats.per / 2)],
    ['trap', 15],
    ['quiet', 12],
  ] as const);

  if (event === 'fight') {
    const t = getEnemy(weightedPick(ctx.rng, zone.enemies));
    exp.lastEvent = { kind: 'fight', text: `${t.name}! ${t.description}` };
    startCombat(state, 'pve', enemyCombatant(t), t.id);
  } else if (event === 'cache') {
    const loot = rollLoot(zone.caches, ctx, (roll(ctx.rng, survival / 2) ? 1 : 0) + (hasPerk(p.perks, 'scrounger') ? 1 : 0));
    const caps = randInt(ctx.rng, 3, 10) * zone.level[0];
    p.caps += caps;
    for (const [id, n] of Object.entries(loot)) addItem(p, id, n);
    const found = [lootText(loot), `${caps} крышек`].filter(Boolean).join(', ');
    exp.lastEvent = { kind: 'cache', text: `Тайник! Найдено: ${found}.` };
    toasts.push({ text: `Тайник: ${found}`, tone: 'loot' });
  } else if (event === 'trap') {
    if (roll(ctx.rng, survival + p.stats.per * 3)) {
      grantXp(p, 5 * zone.level[0], toasts);
      exp.lastEvent = { kind: 'trap', text: 'Растяжка! Ты вовремя заметил проволоку и обезвредил её. +опыт.' };
    } else {
      const dmg = randInt(ctx.rng, 3, 8) * zone.level[0];
      p.hp = Math.max(1, p.hp - dmg);
      exp.lastEvent = { kind: 'trap', text: `Растяжка! Взрыв посекло осколками: −${dmg} ОЗ.` };
      toasts.push({ text: `Ловушка: −${dmg} ОЗ`, tone: 'bad' });
    }
  } else {
    exp.lastEvent = { kind: 'quiet', text: 'Тишина. Только капает вода и щёлкает дозиметр.' };
  }
}

// ── Персонаж ──

function validateCreate(a: Extract<PlayerAction, { type: 'create' }>): void {
  const name = a.name.trim();
  if (name.length < 2 || name.length > 20) throw new GameError('Имя — от 2 до 20 символов');
  let total = 0;
  for (const k of STAT_KEYS) {
    const v = a.stats[k];
    if (!Number.isInteger(v) || v < STAT_MIN || v > STAT_MAX) throw new GameError('Характеристики — от 1 до 10');
    total += v;
  }
  if (total !== START_STAT_POINTS) throw new GameError(`Распредели ровно ${START_STAT_POINTS} очков характеристик`);
  if (!getPerk(a.perk).starter) throw new GameError('Эту особенность нельзя взять на старте');
}

function createPlayer(a: Extract<PlayerAction, { type: 'create' }>): Player {
  validateCreate(a);
  const p: Player = {
    name: a.name.trim(),
    level: 1,
    xp: 0,
    stats: { ...a.stats },
    skills: { guns: 0, energy: 0, melee: 0, medicine: 0, barter: 0, survival: 0 },
    unspentSkillPoints: 0,
    unspentStatPoints: 0,
    unspentPerks: 0,
    perks: [a.perk],
    hp: 0,
    rads: 0,
    caps: 200,
    inventory: { pm: 1, ammo_9: 24, shiv: 1, vatnik: 1, stim: 3, water: 2 },
    equipment: { weapon: 'pm', body: 'vatnik', head: null },
    look: a.look,
  };
  p.hp = maxHp(p);
  return p;
}

// ── Редьюсер ──

/** Применяет действие игрока. Не мутирует входное состояние. */
export function applyAction(input: GameState, action: PlayerAction, ctx: EngineContext): ActionResult {
  const state = tick(clone(input), ctx.now);
  const toasts: Toast[] = [];

  switch (action.type) {
    case 'create': {
      if (state.player) throw new GameError('Персонаж уже создан');
      state.player = createPlayer(action);
      journal(state, `${state.player.name} выходит из бункера в Академгородке.`);
      break;
    }
    case 'travel': {
      const p = requireSettlement(state);
      const dest = getSettlement(action.to);
      if (dest.id === state.location) throw new GameError('Ты уже здесь');
      if (isOverweight(p)) throw new GameError('Перегруз! С таким весом далеко не уйдёшь.');
      const dist = travelDistance(state.location, dest.id);
      state.location = dest.id;
      toasts.push({ text: `Прибытие: ${dest.name}`, tone: 'info' });
      journal(state, `Путь в ${dest.name}.`);
      const survival = skillValue(p.stats, p.skills, 'survival');
      if (roll(ctx.rng, clamp(dist * 0.8 - survival / 4, 5, 45))) {
        const t = getEnemy(dest.roadEnemies[Math.floor(ctx.rng() * dest.roadEnemies.length)]);
        startCombat(state, 'travel', enemyCombatant(t), t.id);
        toasts.push({ text: `Засада в пути: ${t.name}!`, tone: 'bad' });
      }
      break;
    }
    case 'enterZone': {
      const p = requireSettlement(state);
      const zone = getZone(action.zone);
      if (zone.settlement !== state.location) throw new GameError('Эта локация в другом регионе');
      if (p.hp < maxHp(p) * 0.25) throw new GameError('Ты слишком слаб. Подлечись перед вылазкой.');
      state.expedition = { zone: zone.id, depth: 0, bossDefeated: false, lastEvent: { kind: 'enter', text: zone.description } };
      break;
    }
    case 'explore':
      exploreStep(state, ctx, toasts);
      break;
    case 'leaveZone': {
      requireIdle(state);
      if (!state.expedition) throw new GameError('Ты не в экспедиции');
      state.expedition = null;
      break;
    }
    case 'combatTurn':
      combatTurn(state, action.actions, ctx, toasts);
      break;
    case 'flee': {
      const combat = state.combat;
      if (!combat || combat.result) throw new GameError('Боя нет');
      if (combat.kind === 'arena' || combat.kind === 'boss') throw new GameError('С арены и от босса не сбежать!');
      const p = requirePlayer(state);
      const player = playerCombatant(state);
      if (roll(ctx.rng, fleeChance(player, skillValue(p.stats, p.skills, 'survival')))) {
        combat.lastRound = [{ kind: 'flee', actor: 'player', success: true }];
        combat.result = { outcome: 'fled', xp: 0, caps: 0, loot: {}, levelUp: false };
      } else {
        combatTurn(state, null, ctx, toasts);
        combat.lastRound.unshift({ kind: 'flee', actor: 'player', success: false });
      }
      break;
    }
    case 'finishCombat': {
      const combat = state.combat;
      if (!combat?.result) throw new GameError('Бой ещё не окончен');
      if (combat.result.outcome === 'lose' && combat.kind !== 'arena') state.expedition = null;
      if (combat.result.outcome === 'fled' && state.expedition) state.expedition.lastEvent = { kind: 'quiet', text: 'Ты оторвался от погони и затаился.' };
      state.combat = null;
      break;
    }
    case 'useItem': {
      const p = requireIdle(state);
      const item = getItem(action.item);
      if (item.type !== 'consumable') throw new GameError('Это нельзя использовать');
      removeItem(p, item.id, 1);
      if (item.effect.heal) p.hp = Math.min(maxHp(p), p.hp + Math.round(item.effect.heal * healMult(p)));
      if (item.effect.rads) p.rads = clamp(p.rads + item.effect.rads, 0, 1000);
      toasts.push({ text: `Использовано: ${item.name}`, tone: 'good' });
      break;
    }
    case 'equip': {
      const p = requireIdle(state);
      const item = getItem(action.item);
      if (!p.inventory[item.id]) throw new GameError('Этого предмета нет в инвентаре');
      if (item.type === 'weapon') p.equipment.weapon = item.id;
      else if (item.type === 'armor') p.equipment[item.slot] = item.id;
      else throw new GameError('Это нельзя надеть');
      p.hp = Math.min(p.hp, maxHp(p));
      break;
    }
    case 'unequip': {
      const p = requireIdle(state);
      p.equipment[action.slot] = null;
      break;
    }
    case 'drop': {
      const p = requireIdle(state);
      if (getItem(action.item).type === 'quest') throw new GameError('Квестовый предмет выбрасывать нельзя');
      removeItem(p, action.item, positive(action.count));
      break;
    }
    case 'buy': {
      const p = requireSettlement(state);
      const s = getSettlement(state.location);
      if (!s.trader.stock.includes(action.item)) throw new GameError('У торговца нет такого товара');
      const count = positive(action.count);
      const cost = buyPrice(action.item, skillValue(p.stats, p.skills, 'barter')) * count;
      if (p.caps < cost) throw new GameError('Не хватает крышек');
      p.caps -= cost;
      addItem(p, action.item, count);
      toasts.push({ text: `Куплено: ${getItem(action.item).name}${count > 1 ? ` ×${count}` : ''}`, tone: 'loot' });
      break;
    }
    case 'sell': {
      const p = requireSettlement(state);
      const item = getItem(action.item);
      if (item.type === 'quest') throw new GameError('Квестовые предметы не продаются');
      const count = positive(action.count);
      removeItem(p, item.id, count);
      const gain = sellPrice(item.id, skillValue(p.stats, p.skills, 'barter')) * count;
      p.caps += gain;
      toasts.push({ text: `Продано за ${gain} крышек`, tone: 'good' });
      break;
    }
    case 'rest': {
      const p = requireSettlement(state);
      const price = getSettlement(state.location).innPrice + p.level * 2;
      if (p.caps < price) throw new GameError(`Ночлег стоит ${price} крышек`);
      p.caps -= price;
      p.hp = maxHp(p);
      toasts.push({ text: 'Ты выспался. ОЗ восстановлены.', tone: 'good' });
      break;
    }
    case 'acceptQuest': {
      const p = requireSettlement(state);
      const q = getQuest(action.quest);
      if (q.settlement !== state.location) throw new GameError('Этот квест выдают в другом поселении');
      const view = questView(state, q);
      if (view.status !== 'available') throw new GameError(p.level < q.minLevel ? `Нужен ${q.minLevel} уровень` : 'Квест недоступен');
      state.quests[q.id] = { status: 'active', count: 0 };
      toasts.push({ text: `Новое задание: ${q.title}`, tone: 'info' });
      break;
    }
    case 'completeQuest': {
      const p = requireSettlement(state);
      const q = getQuest(action.quest);
      if (q.settlement !== state.location) throw new GameError('Сдавать нужно там, где брал');
      if (questView(state, q).status !== 'done') throw new GameError('Задание ещё не выполнено');
      if (q.goal.kind === 'fetch') removeItem(p, q.goal.item, q.goal.count);
      const caps = Math.round(q.reward.caps * (1 + (p.stats.cha - 5) * 0.05));
      p.caps += caps;
      for (const [id, n] of Object.entries(q.reward.items ?? {})) addItem(p, id, n);
      state.quests[q.id] = { status: 'rewarded', count: q.goal.count };
      toasts.push({ text: `Задание выполнено: ${q.title}. +${caps} крышек`, tone: 'good' });
      grantXp(p, q.reward.xp, toasts);
      journal(state, `Выполнено задание «${q.title}».`);
      break;
    }
    case 'allocate': {
      const p = requireIdle(state);
      let skillSpent = 0;
      for (const k of SKILL_KEYS) {
        const v = action.skills[k] ?? 0;
        if (!Number.isInteger(v) || v < 0) throw new GameError('Неверное число очков');
        skillSpent += v;
      }
      let statSpent = 0;
      for (const k of STAT_KEYS) {
        const v = action.stats[k] ?? 0;
        if (!Number.isInteger(v) || v < 0) throw new GameError('Неверное число очков');
        if (p.stats[k] + v > STAT_MAX) throw new GameError('Характеристика не может быть больше 10');
        statSpent += v;
      }
      if (skillSpent > p.unspentSkillPoints || statSpent > p.unspentStatPoints) throw new GameError('Недостаточно очков');
      for (const k of SKILL_KEYS) p.skills[k as SkillKey] += action.skills[k] ?? 0;
      for (const k of STAT_KEYS) p.stats[k as StatKey] += action.stats[k] ?? 0;
      p.unspentSkillPoints -= skillSpent;
      p.unspentStatPoints -= statSpent;
      break;
    }
    case 'pickPerk': {
      const p = requireIdle(state);
      const perk = getPerk(action.perk);
      if (p.unspentPerks <= 0) throw new GameError('Нет доступных перков');
      if (p.perks.includes(perk.id)) throw new GameError('Перк уже взят');
      if (p.level < perk.minLevel) throw new GameError(`Нужен ${perk.minLevel} уровень`);
      p.perks.push(perk.id);
      p.unspentPerks--;
      toasts.push({ text: `Новый перк: ${perk.name}`, tone: 'level' });
      break;
    }
    case 'arenaFight': {
      const p = requireSettlement(state);
      if (p.hp < maxHp(p) * 0.5) throw new GameError('На ринг с половиной здоровья не пускают. Подлечись.');
      const opp = action.opponent;
      const enemy = combatantFromLoadout(snapshotLoadout(opp), emptyParts());
      startCombat(state, 'arena', enemy, null, opp.id);
      state.combat!.opponentRating = opp.rating;
      state.combat!.log = [`Гонг! ${opp.name} (ур. ${opp.level}) выходит на ринг.`];
      break;
    }
  }

  state.updatedAt = ctx.now;
  return { state, toasts };
}

function positive(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new GameError('Неверное количество');
  return n;
}

/** Регенерация ОЗ по реальному времени — только в поселении и вне боя. */
export function tick(state: GameState, now: number): GameState {
  const p = state.player;
  if (p && !state.combat && !state.expedition) {
    const minutes = Math.floor((now - state.updatedAt) / 60_000);
    if (minutes > 0) {
      p.hp = Math.min(maxHp(p), p.hp + minutes * healingRate(p.stats));
      state.updatedAt += minutes * 60_000;
    }
  }
  return state;
}


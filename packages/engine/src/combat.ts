import { getItem } from './content/items.ts';
import { clamp, randInt, roll, weightedPick } from './rng.ts';
import { BODY_PARTS, critChance, currentAp, emptyParts, hitChance, PART_INFO, partLabel } from './stats.ts';
import type {
  BodyPart,
  Combatant,
  CombatEvent,
  ConsumableEffect,
  DeathKind,
  EnemyTemplate,
  ItemId,
  Rng,
  Side,
  TurnAction,
} from './types.ts';

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

export function enemyCombatant(t: EnemyTemplate): Combatant {
  return {
    id: t.id,
    name: t.name,
    level: t.level,
    stats: t.stats,
    skill: t.skill,
    hp: t.hp,
    maxHp: t.hp,
    maxAp: 5 + Math.floor(t.stats.agi / 2),
    weapon: t.weapon,
    armor: { body: t.armor, head: t.armor },
    critChance: t.stats.luck,
    aimedCritBonus: 0,
    critDamageBonus: 0,
    meleeBonus: t.weapon.skill === 'melee' ? Math.max(0, t.stats.str - 5) : 0,
    bloodyMess: false,
    parts: emptyParts(),
    look: t.look,
  };
}

const LIMBS: BodyPart[] = ['rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

function deathKindFor(attacker: Combatant, part: BodyPart, crit: boolean, overkill: number): DeathKind {
  const gory = crit || attacker.bloodyMess;
  const fx = attacker.weapon.fx;
  if (fx === 'laser' && gory) return 'ash';
  if (fx === 'plasma' && gory) return 'goo';
  const heavy = fx === 'pellets' || attacker.weapon.skill === 'melee';
  const threshold = heavy ? 3 : 6;
  if ((part === 'head' || part === 'eyes') && (gory || overkill >= threshold)) return 'headExplode';
  if (LIMBS.includes(part) && (gory || overkill >= threshold)) return 'limbOff';
  if ((part === 'torso' || part === 'groin') && (gory || overkill >= threshold * 2)) return 'torsoBurst';
  return 'collapse';
}

/** Один выстрел/удар. Мутирует target. */
export function performAttack(attacker: Combatant, target: Combatant, part: BodyPart, actor: Side, rng: Rng): CombatEvent {
  const w = attacker.weapon;
  const miss: CombatEvent = { kind: 'attack', actor, part, hit: false, crit: false, damage: 0, hpAfter: target.hp, crippled: false, fx: w.fx };
  if (!roll(rng, hitChance(attacker, target, part))) return miss;

  const info = PART_INFO[part];
  const crit = roll(rng, critChance(attacker, part));
  const armor = part === 'head' || part === 'eyes' ? target.armor.head : target.armor.body;
  let dmg = randInt(rng, w.damage[0], w.damage[1]) + (w.skill === 'melee' ? attacker.meleeBonus : 0);
  dmg *= info.damageMult * (attacker.bloodyMess ? 1.05 : 1);
  if (crit) dmg *= w.critMult + attacker.critDamageBonus;
  else dmg -= armor.dt;
  dmg *= 1 - armor.dr / 100;
  const damage = Math.max(1, Math.round(dmg));

  const overkill = damage - target.hp;
  target.hp = Math.max(0, target.hp - damage);

  let crippled = false;
  const partDamage = (target.parts.damage[part] ?? 0) + damage;
  target.parts.damage[part] = partDamage;
  if (!target.parts.crippled.includes(part) && partDamage >= target.maxHp * info.crippleAt) {
    target.parts.crippled.push(part);
    crippled = true;
    if (part === 'groin') target.parts.stunned = true;
  }

  const event: CombatEvent = { ...miss, hit: true, crit, damage, hpAfter: target.hp, crippled };
  if (target.hp <= 0) event.death = deathKindFor(attacker, part, crit, overkill);
  return event;
}

/** ИИ: выбирает, куда бить. Чаще в торс, иногда пытается в голову. */
export function enemyPlan(enemy: Combatant, target: Combatant, rng: Rng): TurnAction[] {
  const ap = currentAp(enemy);
  const count = Math.max(1, Math.floor(ap / enemy.weapon.apCost));
  const smart = enemy.skill >= 70;
  const weights: Array<readonly [BodyPart, number]> = BODY_PARTS.map((part) => {
    if (part === 'torso') return [part, 40] as const;
    if (part === 'head') return [part, smart ? 20 : 12] as const;
    if (part === 'eyes') return [part, smart ? 6 : 2] as const;
    if (part === 'groin') return [part, 6] as const;
    // Добиваем уже покалеченные конечности реже — интереснее калечить новые
    return [part, target.parts.crippled.includes(part) ? 3 : 8] as const;
  });
  return Array.from({ length: count }, () => ({ kind: 'attack', part: weightedPick(rng, weights) }) as const);
}

export interface PlayerHooks {
  /** Списывает патрон; false — патронов нет. */
  spendAmmo: () => boolean;
  /** Тратит предмет из инвентаря и возвращает его эффект (или null). */
  consumeItem: (item: ItemId) => ConsumableEffect | null;
  /** Множитель лечения (медицина). */
  healMult: number;
}

export function actionCost(c: Combatant, action: TurnAction): number {
  if (action.kind === 'attack') return c.weapon.apCost;
  const item = getItem(action.item);
  if (item.type !== 'consumable' || item.combatApCost === null) throw new GameError(`«${item.name}» нельзя использовать в бою`);
  return item.combatApCost;
}

export function validatePlan(c: Combatant, actions: TurnAction[]): void {
  if (actions.length === 0) throw new GameError('Выбери хотя бы одно действие');
  const total = actions.reduce((sum, a) => sum + actionCost(c, a), 0);
  if (total > currentAp(c)) throw new GameError(`Не хватает очков действия: нужно ${total}, есть ${currentAp(c)}`);
}

export const initiative = (c: Combatant, rng: Rng): number => c.stats.per * 2 + c.stats.agi + rng() * 6;

/** Разыгрывает ход одной стороны. Возвращает события; останавливается, если кто-то умер. */
function runSide(
  actor: Side,
  self: Combatant,
  other: Combatant,
  actions: TurnAction[],
  rng: Rng,
  hooks: PlayerHooks | null,
): CombatEvent[] {
  const events: CombatEvent[] = [];
  if (self.parts.stunned) {
    self.parts.stunned = false;
    return [{ kind: 'stunned', actor }];
  }
  for (const action of actions) {
    if (self.hp <= 0 || other.hp <= 0) break;
    if (action.kind === 'item') {
      const effect = hooks?.consumeItem(action.item);
      if (!effect) continue;
      const heal = Math.round((effect.heal ?? 0) * (hooks?.healMult ?? 1));
      self.hp = Math.min(self.maxHp, self.hp + heal);
      if (effect.healLimbs) self.parts = emptyParts();
      events.push({ kind: 'item', actor, item: action.item, heal, hpAfter: self.hp });
      continue;
    }
    if (hooks && self.weapon.ammo && !hooks.spendAmmo()) {
      events.push({ kind: 'noAmmo', actor });
      break;
    }
    events.push(performAttack(self, other, action.part, actor, rng));
  }
  return events;
}

export interface RoundOutcome {
  events: CombatEvent[];
  log: string[];
}

/** Полный раунд: инициатива, ход игрока, ход врага. Мутирует бойцов. */
export function playRound(
  player: Combatant,
  enemy: Combatant,
  playerActions: TurnAction[] | null,
  rng: Rng,
  hooks: PlayerHooks,
): RoundOutcome {
  const enemyActions = enemyPlan(enemy, player, rng);
  const playerFirst = playerActions !== null && initiative(player, rng) >= initiative(enemy, rng);
  const events: CombatEvent[] = [];
  const playerTurn = () => (playerActions ? events.push(...runSide('player', player, enemy, playerActions, rng, hooks)) : 0);
  const enemyTurn = () => events.push(...runSide('enemy', enemy, player, enemyActions, rng, null));

  if (playerFirst) {
    playerTurn();
    if (enemy.hp > 0) enemyTurn();
  } else {
    enemyTurn();
    if (player.hp > 0) playerTurn();
  }
  return { events, log: events.map((e) => describeEvent(e, player, enemy)) };
}

export function fleeChance(player: Combatant, survival: number): number {
  const legs = player.parts.crippled.filter((p) => p === 'leftLeg' || p === 'rightLeg').length;
  return clamp(30 + player.stats.agi * 4 + Math.floor(survival / 4) - legs * 20, 5, 90);
}

const DEATH_TEXT: Record<DeathKind, string> = {
  headExplode: 'Голова разлетается кровавыми брызгами!',
  limbOff: 'Конечность отлетает в сторону!',
  torsoBurst: 'Тело разрывает пополам!',
  ash: 'Превращается в кучку дымящегося пепла!',
  goo: 'Растекается лужей зелёной слизи!',
  collapse: 'Падает замертво.',
};

export function describeEvent(e: CombatEvent, player: Combatant, enemy: Combatant): string {
  const who = (side: Side) => (side === 'player' ? 'Вы' : enemy.name);
  const target = (side: Side) => (side === 'player' ? enemy : player);
  switch (e.kind) {
    case 'stunned':
      return `${who(e.actor)} — скрючило от боли, ход пропущен.`;
    case 'noAmmo':
      return e.actor === 'player' ? 'Щёлк! Патроны кончились.' : `${enemy.name} перезаряжается.`;
    case 'flee':
      return e.success ? 'Вы сбежали с поля боя.' : 'Сбежать не удалось!';
    case 'item':
      return `${who(e.actor)}: ${getItem(e.item).name}, +${e.heal} ОЗ.`;
    case 'attack': {
      const t = target(e.actor);
      const part = partLabel(e.part, t.look).toLowerCase();
      if (!e.hit) return e.actor === 'player' ? `Вы промахнулись (${part}).` : `${enemy.name} промахивается.`;
      const subject = e.actor === 'player' ? `${t.name} получает` : 'Вы получаете';
      let text = `${subject} ${e.damage} урона в ${part}.`;
      if (e.crit) text = `Крит! ${text}`;
      if (e.crippled && PART_INFO[e.part].crippleText) text += ` (${PART_INFO[e.part].crippleText})`;
      if (e.death) text += ` ${DEATH_TEXT[e.death]}`;
      return text;
    }
  }
}

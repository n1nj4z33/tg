import { describe, expect, it } from 'vitest';
import {
  applyAction,
  enemyCombatant,
  generateGladiator,
  generateGladiators,
  getEnemy,
  maxHp,
  newGame,
  performAttack,
  playerCombatant,
  questView,
  QUESTS,
  seededRng,
  xpForLevel,
  type EngineContext,
  type GameState,
  type PlayerAction,
} from './index.ts';

const ctx = (seed = 1, now = 1_000_000): EngineContext => ({ rng: seededRng(seed), now });

const created = (): GameState =>
  applyAction(newGame(0), {
    type: 'create',
    name: 'Ник',
    stats: { str: 6, per: 7, end: 5, cha: 3, int: 5, agi: 7, luck: 7 },
    perk: 'bloodyMess',
    look: { skin: '#c99a76', hair: '#2a1d14' },
  }, ctx()).state;

const act = (state: GameState, action: PlayerAction, seed = 1) => applyAction(state, action, ctx(seed, state.updatedAt)).state;

describe('создание персонажа', () => {
  it('создаёт персонажа со стартовым снаряжением', () => {
    const s = created();
    expect(s.player?.name).toBe('Ник');
    expect(s.player?.equipment.weapon).toBe('pm');
    expect(s.player?.hp).toBe(maxHp(s.player!));
  });

  it('отклоняет неверную сумму характеристик', () => {
    expect(() =>
      applyAction(newGame(0), {
        type: 'create', name: 'Читер', perk: 'finesse', look: { skin: '#fff', hair: '#000' },
        stats: { str: 10, per: 10, end: 10, cha: 10, int: 10, agi: 10, luck: 10 },
      }, ctx()),
    ).toThrow(/ровно 40/);
  });

  it('не мутирует входное состояние', () => {
    const s = created();
    const before = JSON.stringify(s);
    act(s, { type: 'buy', item: 'stim', count: 1 });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('бой', () => {
  it('попадание в голову с Кровавой баней при смерти взрывает голову', () => {
    const s = created();
    const player = playerCombatant(s);
    const rat = enemyCombatant(getEnemy('radrat'));
    rat.hp = 1;
    // ищем сид, при котором выстрел попадает
    for (let seed = 1; seed < 200; seed++) {
      const target = JSON.parse(JSON.stringify(rat)) as typeof rat;
      const e = performAttack(player, target, 'head', 'player', seededRng(seed));
      if (e.kind === 'attack' && e.hit) {
        expect(e.death).toBe('headExplode');
        return;
      }
    }
    throw new Error('ни одного попадания за 200 попыток');
  });

  it('тратит патроны и не даёт превысить ОД', () => {
    let s = created();
    s = act(s, { type: 'enterZone', zone: 'academ_sewers' });
    // гарантированно получаем бой
    for (let seed = 1; !s.combat; seed++) s = act(s, { type: 'explore' }, seed);
    const ammo = s.player!.inventory.ammo_9;
    expect(() => act(s, { type: 'combatTurn', actions: Array(5).fill({ kind: 'attack', part: 'torso' }) })).toThrow(/очков действия/);
    const after = act(s, { type: 'combatTurn', actions: [{ kind: 'attack', part: 'torso' }] });
    expect(after.player!.inventory.ammo_9).toBe(ammo - 1);
    expect(after.combat!.lastRound.length).toBeGreaterThan(0);
  });

  it('новичок с ПМ побеждает радкрысу в большинстве боёв', () => {
    let wins = 0;
    for (let seed = 1; seed <= 100; seed++) {
      let s = created();
      s.combat = {
        kind: 'pve', round: 0, enemyTemplate: 'radrat', enemy: enemyCombatant(getEnemy('radrat')),
        playerParts: { damage: {}, crippled: [] }, lastRound: [], log: [], result: null,
      };
      for (let round = 0; !s.combat!.result && round < 30; round++) {
        s = act(s, { type: 'combatTurn', actions: [{ kind: 'attack', part: 'torso' }] }, seed * 100 + round);
      }
      if (s.combat!.result?.outcome === 'win') wins++;
    }
    expect(wins).toBeGreaterThan(85);
  });

  it('победа засчитывается в квест на убийство и даёт опыт', () => {
    let s = act(created(), { type: 'acceptQuest', quest: 'rats' });
    s.combat = {
      kind: 'pve', round: 0, enemyTemplate: 'radrat', enemy: { ...enemyCombatant(getEnemy('radrat')), hp: 1 },
      playerParts: { damage: {}, crippled: [] }, lastRound: [], log: [], result: null,
    };
    for (let i = 0; !s.combat!.result && i < 20; i++) s = act(s, { type: 'combatTurn', actions: [{ kind: 'attack', part: 'torso' }] }, i);
    expect(s.combat!.result!.outcome).toBe('win');
    expect(s.quests.rats.count).toBe(1);
    expect(s.player!.xp).toBe(getEnemy('radrat').xp);
    s = act(s, { type: 'finishCombat' });
    expect(s.combat).toBeNull();
  });
});

describe('экономика и прогресс', () => {
  it('покупка и продажа меняют крышки', () => {
    const s = created();
    const bought = act(s, { type: 'buy', item: 'stim', count: 2 });
    expect(bought.player!.caps).toBeLessThan(s.player!.caps);
    expect(bought.player!.inventory.stim).toBe(5);
    const sold = act(bought, { type: 'sell', item: 'stim', count: 5 });
    expect(sold.player!.inventory.stim).toBeUndefined();
  });

  it('продажа экипированного оружия снимает его', () => {
    const s = act(created(), { type: 'sell', item: 'pm', count: 1 });
    expect(s.player!.equipment.weapon).toBeNull();
  });

  it('перегруз запрещает путешествие', () => {
    const s = created();
    s.player!.inventory.scrap = 200;
    expect(() => act(s, { type: 'travel', to: 'vanavara' })).toThrow(/Перегруз/);
  });

  it('квест на доставку забирает предметы и выдаёт награду', () => {
    let s = created();
    s.player!.level = 3;
    s = act(s, { type: 'acceptQuest', quest: 'vector_samples' });
    expect(questView(s, QUESTS.vector_samples).status).toBe('active');
    s.player!.inventory.vector_sample = 3;
    expect(questView(s, QUESTS.vector_samples).status).toBe('done');
    s = act(s, { type: 'completeQuest', quest: 'vector_samples' });
    expect(s.player!.inventory.vector_sample).toBeUndefined();
    expect(s.quests.vector_samples.status).toBe('rewarded');
    expect(questView(s, QUESTS.vector_zero).status).not.toBe('rewarded');
  });

  it('повышение уровня даёт очки навыков, раз в 3 уровня — перк', () => {
    let s = created();
    s.player!.xp = xpForLevel(3) - 1;
    s = act(s, { type: 'acceptQuest', quest: 'rats' });
    s.quests.rats.count = 10;
    s = act(s, { type: 'completeQuest', quest: 'rats' });
    expect(s.player!.level).toBeGreaterThanOrEqual(3);
    expect(s.player!.unspentSkillPoints).toBeGreaterThan(0);
    expect(s.player!.unspentPerks).toBe(1);
    s = act(s, { type: 'allocate', skills: { guns: 5 }, stats: {} });
    expect(s.player!.skills.guns).toBe(5);
    s = act(s, { type: 'pickPerk', perk: 'sniper' });
    expect(s.player!.perks).toContain('sniper');
  });

  it('регенерация ОЗ идёт по реальному времени', () => {
    const s = created();
    s.player!.hp = 5;
    const later = applyAction(s, { type: 'unequip', slot: 'head' }, ctx(1, s.updatedAt + 5 * 60_000)).state;
    expect(later.player!.hp).toBeGreaterThan(5);
  });
});

describe('арена', () => {
  it('бот восстанавливается из id детерминированно', () => {
    const [bot] = generateGladiators(5, 123_456_789);
    expect(generateGladiator(bot.id)).toEqual(bot);
  });

  it('бой на арене меняет рейтинг', () => {
    let s = created();
    const [opp] = generateGladiators(1, 0);
    s = act(s, { type: 'arenaFight', opponent: opp });
    expect(s.combat?.kind).toBe('arena');
    for (let i = 0; !s.combat!.result && i < 50; i++) s = act(s, { type: 'combatTurn', actions: [{ kind: 'attack', part: 'torso' }] }, i + 7);
    expect(s.combat!.result!.rating).not.toBe(0);
    expect(s.arena.wins + s.arena.losses).toBe(1);
  });
});

import {
  carryCapacity,
  currentAp,
  equippedWeapon,
  getItem,
  getPerk,
  maxHp,
  PERKS,
  playerCombatant,
  radResistance,
  SKILL_INFO,
  SKILL_KEYS,
  skillValue,
  STAT_INFO,
  STAT_KEYS,
  STAT_MAX,
  xpForLevel,
  type Skills,
  type Stats,
} from '@radclub/engine';
import { useState } from 'react';
import { Creature } from '../art/Creature.tsx';
import { usePlayerState } from '../state/GameProvider.tsx';
import { Bar, Button, ChoiceCard, Crt, Modal, Panel, Readout, Stepper } from '../ui/index.ts';

const ZERO_SKILLS: Skills = { guns: 0, energy: 0, melee: 0, medicine: 0, barter: 0, survival: 0 };
const ZERO_STATS: Stats = { str: 0, per: 0, end: 0, cha: 0, int: 0, agi: 0, luck: 0 };

export function CharacterScreen() {
  const { state, player, run, busy, api, replaceState, notify } = usePlayerState();
  const [skillDraft, setSkillDraft] = useState<Skills>(ZERO_SKILLS);
  const [statDraft, setStatDraft] = useState<Stats>(ZERO_STATS);
  const [perkOpen, setPerkOpen] = useState(false);
  const me = playerCombatant(state);
  const skillLeft = player.unspentSkillPoints - SKILL_KEYS.reduce((s, k) => s + skillDraft[k], 0);
  const statLeft = player.unspentStatPoints - STAT_KEYS.reduce((s, k) => s + statDraft[k], 0);
  const drafted = skillLeft !== player.unspentSkillPoints || statLeft !== player.unspentStatPoints;
  const draftStats: Stats = Object.fromEntries(STAT_KEYS.map((k) => [k, player.stats[k] + statDraft[k]])) as Stats;
  const draftSkills: Skills = Object.fromEntries(SKILL_KEYS.map((k) => [k, player.skills[k] + skillDraft[k]])) as Skills;

  const apply = async () => {
    const res = await run({ type: 'allocate', skills: skillDraft, stats: statDraft });
    if (res) {
      setSkillDraft(ZERO_SKILLS);
      setStatDraft(ZERO_STATS);
    }
  };

  const reset = async () => {
    if (!window.confirm('Удалить персонажа и начать заново?')) return;
    try {
      replaceState(await api.reset());
    } catch (e) {
      notify({ text: (e as Error).message, tone: 'bad' });
    }
  };

  const weapon = equippedWeapon(player.equipment);

  return (
    <>
      <Panel title={player.name}>
        <div className="char__top">
          <div className="char__doll">
            <Creature look={me.look} />
          </div>
          <div className="stack grow">
            <Bar label={`Уровень ${player.level}`} kind="xp" value={player.xp - xpForLevel(player.level)} max={xpForLevel(player.level + 1) - xpForLevel(player.level)} text={`${player.xp}/${xpForLevel(player.level + 1)}`} />
            <Bar label="Здоровье" kind="hp" value={player.hp} max={maxHp(player)} />
            {player.rads > 0 && <Bar label="Радиация" kind="rad" value={player.rads} max={1000} text={`${player.rads} рад`} />}
            <Crt>
              <Readout label="ОД" value={currentAp(me)} />
              <Readout label="Оружие" value={weapon.name} />
              <Readout label="Броня" value={player.equipment.body ? getItem(player.equipment.body).name : '—'} />
              <Readout label="Шлем" value={player.equipment.head ? getItem(player.equipment.head).name : '—'} />
            </Crt>
          </div>
        </div>
      </Panel>

      <Panel title="Характеристики">
        {player.unspentStatPoints > 0 && <div className="small amber" style={{ marginBottom: 6 }}>Свободных очков: {statLeft}</div>}
        <div className="stack">
          {STAT_KEYS.map((k) => (
            <div key={k} className="stat-line">
              <span className="stat-line__short">{STAT_INFO[k].short}</span>
              <span className="grow">
                {STAT_INFO[k].name}
                <span className="stat-line__desc">{STAT_INFO[k].description}</span>
              </span>
              {player.unspentStatPoints > 0 ? (
                <Stepper
                  value={draftStats[k]}
                  onDec={() => setStatDraft({ ...statDraft, [k]: statDraft[k] - 1 })}
                  onInc={() => setStatDraft({ ...statDraft, [k]: statDraft[k] + 1 })}
                  canDec={statDraft[k] > 0}
                  canInc={statLeft > 0 && draftStats[k] < STAT_MAX}
                />
              ) : (
                <span className="counter-box">{String(player.stats[k]).padStart(2, '0')}</span>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Навыки">
        {player.unspentSkillPoints > 0 && <div className="small amber" style={{ marginBottom: 6 }}>Очков навыков: {skillLeft}</div>}
        <div className="stack">
          {SKILL_KEYS.map((k) => (
            <div key={k} className="stat-line">
              <span className="grow">
                {SKILL_INFO[k].name}
                <span className="stat-line__desc">{SKILL_INFO[k].description}</span>
              </span>
              <span className="green">{skillValue(draftStats, draftSkills, k)}%</span>
              {player.unspentSkillPoints > 0 && (
                <Stepper
                  value={skillDraft[k]}
                  onDec={() => setSkillDraft({ ...skillDraft, [k]: skillDraft[k] - 1 })}
                  onInc={() => setSkillDraft({ ...skillDraft, [k]: skillDraft[k] + 1 })}
                  canDec={skillDraft[k] > 0}
                  canInc={skillLeft > 0}
                />
              )}
            </div>
          ))}
        </div>
        {drafted && (
          <Button variant="primary" lamp block style={{ marginTop: 10 }} disabled={busy} onClick={apply}>
            Применить
          </Button>
        )}
      </Panel>

      <Panel title="Перки">
        <div className="stack">
          {player.perks.map((id) => (
            <div key={id}>
              <div className="amber">{getPerk(id).name}</div>
              <div className="small dim">{getPerk(id).description}</div>
            </div>
          ))}
          {player.unspentPerks > 0 && (
            <Button variant="green" lamp onClick={() => setPerkOpen(true)}>
              Выбрать перк ({player.unspentPerks})
            </Button>
          )}
        </div>
      </Panel>

      <Crt>
        <Readout label="Переносимый вес" value={`${carryCapacity(player)} кг`} />
        <Readout label="Шанс крита" value={`${me.critChance}%`} />
        <Readout label="Защита от радиации" value={`${radResistance(player)}%`} />
        <Readout label="ПУ / СУ брони" value={`${me.armor.body.dt} / ${me.armor.body.dr}%`} />
        <Readout label="Рейтинг ринга" value={state.arena.rating} />
        <Readout label="Побед / поражений" value={`${state.arena.wins} / ${state.arena.losses}`} />
        <Readout label="Убито тварей" value={Object.values(state.kills).reduce((a, b) => a + b, 0)} />
      </Crt>

      <Button variant="ghost" size="sm" onClick={reset}>
        Начать заново
      </Button>

      {perkOpen && (
        <Modal title="Новый перк" onClose={() => setPerkOpen(false)}>
          <div className="stack">
            {Object.values(PERKS)
              .filter((p) => !player.perks.includes(p.id))
              .map((p) => (
                <ChoiceCard
                  key={p.id}
                  disabled={busy || player.level < p.minLevel}
                  onClick={async () => {
                    if (await run({ type: 'pickPerk', perk: p.id })) setPerkOpen(false);
                  }}
                >
                  <div>
                    {p.name} {player.level < p.minLevel && <span className="small red">· с {p.minLevel} ур.</span>}
                  </div>
                  <div className="small dim">{p.description}</div>
                </ChoiceCard>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}

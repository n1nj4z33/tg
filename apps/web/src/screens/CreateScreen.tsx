import {
  carryCapacity,
  combatantFromLoadout,
  emptyParts,
  maxHp,
  PERKS,
  SKILL_INFO,
  SKILL_KEYS,
  skillValue,
  START_STAT_POINTS,
  STAT_INFO,
  STAT_KEYS,
  STAT_MAX,
  STAT_MIN,
  type PerkId,
  type Skills,
  type Stats,
} from '@radclub/engine';
import { useMemo, useState } from 'react';
import { Creature } from '../art/Creature.tsx';
import { Scene } from '../art/Scene.tsx';
import { useGame } from '../state/GameProvider.tsx';
import { telegramName } from '../telegram/telegram.ts';
import { Button, ChoiceCard, Crt, cx, Panel, Readout, Stepper } from '../ui/index.ts';
import './screens.css';

const SKINS = ['#f0c8a8', '#e0b08c', '#c99a76', '#a87454', '#8d5f3f', '#6b4430'];
const HAIRS = ['#1a1a1a', '#2a1d14', '#5a3a1e', '#a0a0a0', '#c8a050', '#7a2a1a'];
const NO_SKILLS: Skills = { guns: 0, energy: 0, melee: 0, medicine: 0, barter: 0, survival: 0 };

function Swatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="row">
      {colors.map((c) => (
        <button key={c} type="button" className={cx('swatch', c === value && 'swatch--active')} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
      ))}
    </div>
  );
}

export function CreateScreen() {
  const { run, busy } = useGame();
  const [name, setName] = useState(() => telegramName() ?? '');
  const [stats, setStats] = useState<Stats>({ str: 5, per: 5, end: 5, cha: 5, int: 5, agi: 5, luck: 5 });
  const [perk, setPerk] = useState<PerkId>('bloodyMess');
  const [skin, setSkin] = useState(SKINS[2]);
  const [hair, setHair] = useState(HAIRS[1]);

  const left = START_STAT_POINTS - STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  const preview = { stats, level: 1, perks: [perk], rads: 0 };
  const look = useMemo(
    () =>
      combatantFromLoadout(
        { id: 'p', name, level: 1, stats, skills: NO_SKILLS, perks: [perk], equipment: { weapon: 'pm', body: 'vatnik', head: null }, look: { skin, hair }, hp: 1, maxHp: 1, hasAmmo: true },
        emptyParts(),
      ).look,
    [name, stats, perk, skin, hair],
  );

  const change = (key: keyof Stats, delta: number) => setStats((s) => ({ ...s, [key]: s[key] + delta }));

  return (
    <div className="app">
      <div className="app__body">
        <Scene scene="academ" className="create__scene">
          <div className="create__title">
            <h1>РАДКЛУБ</h1>
            <div className="small">бойцовский клуб на руинах мира</div>
          </div>
          <div className="create__preview">
            <Creature look={look} />
          </div>
        </Scene>

        <Panel title="Досье выжившего">
          <div className="stack">
            <input className="input" placeholder="Имя или кличка" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="row">
              <span className="dim grow">Кожа</span>
              <Swatches colors={SKINS} value={skin} onChange={setSkin} />
            </div>
            <div className="row">
              <span className="dim grow">Волосы</span>
              <Swatches colors={HAIRS} value={hair} onChange={setHair} />
            </div>
          </div>
        </Panel>

        <Panel title="Характеристики">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="grow dim">Осталось очков</span>
            <span className="counter-box">{String(left).padStart(2, '0')}</span>
          </div>
          <div className="stack">
            {STAT_KEYS.map((k) => (
              <div key={k} className="stat-line">
                <span className="stat-line__short">{STAT_INFO[k].short}</span>
                <span className="grow">
                  {STAT_INFO[k].name}
                  <span className="stat-line__desc">{STAT_INFO[k].description}</span>
                </span>
                <Stepper value={stats[k]} onDec={() => change(k, -1)} onInc={() => change(k, 1)} canDec={stats[k] > STAT_MIN} canInc={stats[k] < STAT_MAX && left > 0} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Особенность">
          <div className="stack">
            {Object.values(PERKS)
              .filter((p) => p.starter)
              .map((p) => (
                <ChoiceCard key={p.id} active={perk === p.id} onClick={() => setPerk(p.id)}>
                  <div>{p.name}</div>
                  <div className="small dim">{p.description}</div>
                </ChoiceCard>
              ))}
          </div>
        </Panel>

        <Crt>
          <Readout label="Здоровье" value={maxHp(preview)} />
          <Readout label="Переносимый вес" value={`${carryCapacity(preview)} кг`} />
          {SKILL_KEYS.map((k) => (
            <Readout key={k} label={SKILL_INFO[k].name} value={`${skillValue(stats, NO_SKILLS, k)}%`} />
          ))}
        </Crt>

        <Button
          variant="primary"
          lamp
          block
          disabled={busy || left !== 0 || name.trim().length < 2}
          onClick={() => run({ type: 'create', name, stats, perk, look: { skin, hair } })}
        >
          {left !== 0 ? `Распредели ещё ${left}` : 'Выйти из бункера'}
        </Button>
      </div>
    </div>
  );
}

import { getEnemy, getSettlement, getZone, maxHp, type Zone } from '@radclub/engine';
import { NavIcon } from '../art/NavIcon.tsx';
import { Scene } from '../art/Scene.tsx';
import { capsText } from '../game/format.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { Bar, Button, Crt, Panel } from '../ui/index.ts';
import './screens.css';

function ZoneCard({ zone, level, onEnter, busy }: { zone: Zone; level: number; onEnter: () => void; busy: boolean }) {
  const danger = level < zone.level[0] ? 'red' : level > zone.level[1] ? 'dim' : 'amber';
  return (
    <div className="zone-card">
      <Scene scene={zone.scene} className="zone-card__scene" />
      <div className="zone-card__body">
        <h3>{zone.name}</h3>
        <div className="small dim">{zone.description}</div>
        <div className="row row--wrap small" style={{ marginTop: 4, columnGap: 6, rowGap: 0 }}>
          <span className={danger}>
            Ур.&nbsp;{zone.level[0]}–{zone.level[1]}
          </span>
          <span className="dim">☢&nbsp;{zone.radPerStep}/шаг</span>
          <span className="dim">босс: {getEnemy(zone.boss).name}</span>
        </div>
        <Button variant="danger" size="sm" lamp onClick={onEnter} disabled={busy} style={{ marginTop: 8 }}>
          Вылазка
        </Button>
      </div>
    </div>
  );
}

export function HubScreen() {
  const { state, player, run, busy, go } = usePlayerState();
  const s = getSettlement(state.location);
  const innPrice = s.innPrice + player.level * 2;
  const hurt = player.hp < maxHp(player);

  return (
    <>
      <Scene scene={s.scene} className="hub__scene">
        <div className="hub__title">
          <div className="small amber">{s.region}</div>
          <h1>{s.name}</h1>
        </div>
      </Scene>

      <Crt>
        <div className="small">{s.description}</div>
        <div className="small amber" style={{ marginTop: 6 }}>
          ⚠ {s.problem}
        </div>
      </Crt>

      <div className="grid-2">
        <Button onClick={() => go('trader')}>
          <NavIcon icon="trader" className="btn-icon" /> Торговец
        </Button>
        <Button variant="primary" lamp onClick={() => go('arena')}>
          <NavIcon icon="arena" className="btn-icon" /> Ринг
        </Button>
        <Button onClick={() => run({ type: 'rest' })} disabled={busy || !hurt}>
          <NavIcon icon="rest" className="btn-icon" /> Ночлег · {innPrice}
        </Button>
        <Button onClick={() => go('quests')}>
          <NavIcon icon="quests" className="btn-icon" /> Задания
        </Button>
      </div>

      <Panel title="Опасные зоны">
        <div className="stack">
          {s.zones.map((id) => (
            <ZoneCard key={id} zone={getZone(id)} level={player.level} busy={busy} onEnter={() => run({ type: 'enterZone', zone: id })} />
          ))}
        </div>
      </Panel>

      {state.journal.length > 0 && (
        <Panel title="Журнал">
          <Crt>
            {state.journal.slice(0, 6).map((line, i) => (
              <div key={i} className="small" style={{ opacity: 1 - i * 0.13 }}>
                › {line}
              </div>
            ))}
          </Crt>
        </Panel>
      )}
      <div className="small dim center">Вне боя ОЗ восстанавливаются сами. Ночлег — сразу, за {capsText(innPrice)}.</div>
    </>
  );
}

export function ZoneScreen() {
  const { state, player, run, busy } = usePlayerState();
  const exp = state.expedition!;
  const zone = getZone(exp.zone);
  const stims = player.inventory.stim ?? 0;
  const progress = Math.min(exp.depth, zone.depth);

  return (
    <>
      <Scene scene={zone.scene} className="hub__scene hub__scene--zone">
        <div className="hub__title">
          <div className="small red">ОПАСНАЯ ЗОНА</div>
          <h1>{zone.name}</h1>
        </div>
      </Scene>

      <Bar label="Глубина" kind="xp" value={progress} max={zone.depth} text={exp.bossDefeated ? 'зачищено' : `${progress}/${zone.depth} · логово босса`} />

      <Crt className={`zone-event zone-event--${exp.lastEvent.kind}`}>
        <div key={exp.depth + exp.lastEvent.text} className="zone-event__text">
          {exp.lastEvent.text}
        </div>
      </Crt>

      <div className="stack">
        {!exp.bossDefeated && (
          <Button variant="danger" lamp block disabled={busy} onClick={() => run({ type: 'explore' })}>
            {exp.depth === 0 ? 'Войти' : exp.depth + 1 >= zone.depth ? 'В логово босса' : 'Идти глубже'}
          </Button>
        )}
        <div className="grid-2">
          <Button disabled={busy || stims === 0 || player.hp >= maxHp(player)} onClick={() => run({ type: 'useItem', item: 'stim' })}>
            Стимулятор ({stims})
          </Button>
          <Button disabled={busy} onClick={() => run({ type: 'leaveZone' })}>
            Отступить
          </Button>
        </div>
      </div>
      <div className="small dim center">
        Каждый шаг — радиация (☢ {zone.radPerStep}). Радиация снижает макс. ОЗ, лечится антирадином.
      </div>
    </>
  );
}

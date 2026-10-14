import { combatantFromLoadout, emptyParts, equippedWeapon, getSettlement, snapshotLoadout, type ArenaSnapshot } from '@radclub/engine';
import { useEffect, useState } from 'react';
import { Creature } from '../art/Creature.tsx';
import { Scene } from '../art/Scene.tsx';
import type { LeaderRow } from '../api/index.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { useBackButton } from '../telegram/useBackButton.ts';
import { Button, Crt, Panel, Readout, Tabs } from '../ui/index.ts';

function OpponentCard({ s, onFight, busy }: { s: ArenaSnapshot; onFight: () => void; busy: boolean }) {
  const look = combatantFromLoadout(snapshotLoadout(s), emptyParts()).look;
  return (
    <div className="opponent">
      <div className="opponent__doll">
        <Creature look={look} />
      </div>
      <div className="grow stack" style={{ gap: 2 }}>
        <div className="amber">{s.name}</div>
        <div className="small dim">
          ур. {s.level} · рейтинг {s.rating} {s.bot ? '· местный' : '· игрок'}
        </div>
        <div className="small">{equippedWeapon(s.equipment).name}</div>
        <Button variant="danger" size="sm" lamp disabled={busy} onClick={onFight}>
          На ринг
        </Button>
      </div>
    </div>
  );
}

export function ArenaScreen() {
  const { state, player, api, call, busy, go, notify } = usePlayerState();
  const back = () => go('hub');
  useBackButton(true, back);
  const [tab, setTab] = useState<'fight' | 'top'>('fight');
  const [opponents, setOpponents] = useState<ArenaSnapshot[] | null>(null);
  const [top, setTop] = useState<LeaderRow[] | null>(null);
  const s = getSettlement(state.location);

  useEffect(() => {
    const onError = (e: Error) => notify({ text: e.message, tone: 'bad' });
    if (tab === 'fight') api.arenaOpponents().then(setOpponents, onError);
    else api.leaderboard().then(setTop, onError);
  }, [api, tab, player.level, notify]);

  return (
    <>
      <Scene scene="arena" className="hub__scene">
        <div className="hub__title">
          <div className="small amber">{s.name}</div>
          <h1>{s.arenaName}</h1>
        </div>
      </Scene>
      <Crt>
        <Readout label="Твой рейтинг" value={state.arena.rating} />
        <Readout label="Победы / поражения" value={`${state.arena.wins} / ${state.arena.losses}`} />
        <div className="small dim" style={{ marginTop: 4 }}>
          Бой до смерти — понарошку: проигравшего уносят. Нужно не меньше половины ОЗ.
        </div>
      </Crt>
      <div className="row">
        <div className="grow">
          <Tabs value={tab} options={[{ value: 'fight', label: 'Соперники' }, { value: 'top', label: 'Рейтинг' }]} onChange={setTab} />
        </div>
        <Button size="sm" variant="ghost" onClick={back}>
          Назад
        </Button>
      </div>
      {tab === 'fight' && (
        <Panel title="Кто на ринг?">
          <div className="stack">
            {!opponents && <div className="dim">Ищем бойцов…</div>}
            {opponents?.map((o) => (
              <OpponentCard key={o.id} s={o} busy={busy} onFight={() => call((a) => a.arenaFight(o.id))} />
            ))}
          </div>
        </Panel>
      )}
      {tab === 'top' && (
        <Crt>
          {!top && <div className="dim">Загрузка…</div>}
          {top?.map((r, i) => (
            <Readout key={`${r.name}-${i}`} label={`${i + 1}. ${r.name} (${r.level})`} value={`${r.rating} · ${r.wins}/${r.losses}`} className={r.name === player.name ? 'amber' : undefined} />
          ))}
        </Crt>
      )}
    </>
  );
}

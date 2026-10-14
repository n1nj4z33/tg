import { getSettlement, isOverweight, SETTLEMENTS, travelDistance, type LocationId } from '@radclub/engine';
import { useState } from 'react';
import { Scene } from '../art/Scene.tsx';
import { WorldMap } from '../art/WorldMap.tsx';
import { usePlayerState } from '../state/GameProvider.tsx';
import { Button, Crt, Panel } from '../ui/index.ts';

export function MapScreen() {
  const { state, player, run, busy, go } = usePlayerState();
  const [selected, setSelected] = useState<LocationId | null>(null);
  const target = selected && selected !== state.location ? getSettlement(selected) : null;
  const overweight = isOverweight(player);
  const inZone = state.expedition !== null;

  const travel = async (id: LocationId) => {
    const res = await run({ type: 'travel', to: id });
    if (res) {
      setSelected(null);
      go('hub');
    }
  };

  return (
    <>
      <Panel title="Карта пустоши">
        <Crt>
          <WorldMap settlements={Object.values(SETTLEMENTS)} current={state.location} selected={selected} level={player.level} onSelect={setSelected} />
        </Crt>
      </Panel>

      {target ? (
        <Panel title={target.name} rust>
          <div className="stack">
            <Scene scene={target.scene} className="map__preview" />
            <div className="small amber">{target.region}</div>
            <div className="small">{target.description}</div>
            <div className="small dim">⚠ {target.problem}</div>
            <div className="small">
              Дорога: {Math.round(travelDistance(state.location, target.id) * 12)} км ·{' '}
              <span className={player.level < target.minLevel ? 'red' : 'green'}>рекомендуемый уровень {target.minLevel}+</span>
            </div>
            {overweight && <div className="small red">Перегруз — сначала избавься от лишнего.</div>}
            {inZone && <div className="small red">Сначала выберись из опасной зоны.</div>}
            <Button variant="primary" lamp block disabled={busy || overweight || inZone} onClick={() => travel(target.id)}>
              Отправиться
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="small dim center">Выбери поселение на карте. В пути могут напасть — чем дальше, тем опаснее.</div>
      )}
    </>
  );
}

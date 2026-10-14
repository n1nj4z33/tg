import { allQuestViews, getEnemy, getItem, getSettlement, type QuestView } from '@radclub/engine';
import { useState } from 'react';
import { capsText } from '../game/format.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { Bar, Button, Crt, ItemRow, Panel, Tabs } from '../ui/index.ts';

type Filter = 'here' | 'active' | 'done';

function QuestCard({ q, here, busy, onAccept, onComplete }: { q: QuestView; here: boolean; busy: boolean; onAccept: () => void; onComplete: () => void }) {
  const goal = q.goal.kind === 'kill' ? `Убить: ${getEnemy(q.goal.enemy).name}` : `Принести: ${getItem(q.goal.item).name}`;
  return (
    <Panel title={q.title} rust={q.status === 'done'}>
      <div className="stack">
        <div className="small dim">
          {q.giver} · {getSettlement(q.settlement).name}
        </div>
        <Crt>
          <div className="small">«{q.text}»</div>
        </Crt>
        {q.status !== 'rewarded' && q.status !== 'locked' && <Bar label={goal} kind="xp" value={q.progress} max={q.goal.count} />}
        {q.status === 'locked' && <div className="small red">Недоступно: нужен {q.minLevel} уровень{q.requires ? ' и предыдущее задание' : ''}.</div>}
        <div className="small">
          Награда: <span className="amber">{capsText(q.reward.caps)}</span>, {q.reward.xp} опыта
        </div>
        {q.reward.items && (
          <div>
            {Object.entries(q.reward.items).map(([id, n]) => (
              <ItemRow key={id} item={id} count={n} />
            ))}
          </div>
        )}
        {here && q.status === 'available' && (
          <Button variant="green" lamp disabled={busy} onClick={onAccept}>
            Взять задание
          </Button>
        )}
        {q.status === 'done' &&
          (here ? (
            <Button variant="primary" lamp disabled={busy} onClick={onComplete}>
              Сдать
            </Button>
          ) : (
            <div className="small amber">Готово — сдай в поселении {getSettlement(q.settlement).name}.</div>
          ))}
      </div>
    </Panel>
  );
}

export function QuestsScreen() {
  const { state, run, busy } = usePlayerState();
  const [filter, setFilter] = useState<Filter>('here');
  const all = allQuestViews(state);
  const list = all.filter((q) => {
    if (filter === 'here') return q.settlement === state.location && q.status !== 'rewarded';
    if (filter === 'active') return q.status === 'active' || q.status === 'done';
    return q.status === 'rewarded';
  });
  const inSettlement = !state.expedition;

  return (
    <>
      <Tabs
        value={filter}
        options={[
          { value: 'here', label: 'Здесь' },
          { value: 'active', label: 'Активные' },
          { value: 'done', label: 'Выполнены' },
        ]}
        onChange={setFilter}
      />
      {list.length === 0 && <div className="dim center">Заданий нет.</div>}
      {list.map((q) => (
        <QuestCard
          key={q.id}
          q={q}
          here={inSettlement && q.settlement === state.location}
          busy={busy}
          onAccept={() => run({ type: 'acceptQuest', quest: q.id })}
          onComplete={() => run({ type: 'completeQuest', quest: q.id })}
        />
      ))}
    </>
  );
}

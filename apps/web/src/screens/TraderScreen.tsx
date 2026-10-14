import { buyPrice, getItem, getSettlement, sellPrice, skillValue, type ItemId } from '@radclub/engine';
import { useState } from 'react';
import { Scene } from '../art/Scene.tsx';
import { capsText, itemSummary } from '../game/format.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { useBackButton } from '../telegram/useBackButton.ts';
import { Button, Crt, ItemRow, Modal, Stepper, Tabs } from '../ui/index.ts';
import { inventoryList, isEquipped } from './InventoryScreen.tsx';

type Mode = 'buy' | 'sell';

export function TraderScreen() {
  const { state, player, run, busy, go } = usePlayerState();
  const back = () => go('hub');
  useBackButton(true, back);
  const s = getSettlement(state.location);
  const barter = skillValue(player.stats, player.skills, 'barter');
  const [mode, setMode] = useState<Mode>('buy');
  const [deal, setDeal] = useState<{ item: ItemId; count: number } | null>(null);

  const price = (id: ItemId) => (mode === 'buy' ? buyPrice(id, barter) : sellPrice(id, barter));
  const rows: Array<[ItemId, number | undefined]> =
    mode === 'buy' ? s.trader.stock.map((id) => [id, undefined]) : inventoryList(player).filter(([id]) => getItem(id).type !== 'quest');
  const maxCount = deal ? (mode === 'buy' ? Math.max(1, Math.floor(player.caps / price(deal.item))) : (player.inventory[deal.item] ?? 1)) : 1;
  const ammo = deal && getItem(deal.item).type === 'ammo';

  const confirm = async () => {
    if (!deal) return;
    const res = await run({ type: mode, item: deal.item, count: deal.count });
    if (res) setDeal(null);
  };

  return (
    <>
      <Scene scene={s.scene} className="trader__scene">
        <div className="trader__bubble">
          <div className="amber small">{s.trader.name}</div>
          <div>«{s.trader.greeting}»</div>
        </div>
      </Scene>
      <div className="row">
        <div className="grow">
          <Tabs value={mode} options={[{ value: 'buy', label: 'Купить' }, { value: 'sell', label: 'Продать' }]} onChange={setMode} />
        </div>
        <Button size="sm" variant="ghost" onClick={back}>
          Назад
        </Button>
      </div>
      <div className="small dim">Бартер {barter}% · у тебя {capsText(player.caps)}</div>
      <Crt>
        {rows.length === 0 && <div className="dim center">Нечего продать.</div>}
        {rows.map(([id, n]) => (
          <ItemRow
            key={id}
            item={id}
            count={n}
            sub={itemSummary(id)}
            badge={mode === 'sell' && isEquipped(player, id) ? 'Э' : undefined}
            right={<span className="amber">◉ {price(id)}</span>}
            onClick={() => setDeal({ item: id, count: getItem(id).type === 'ammo' && mode === 'buy' ? Math.min(10, Math.max(1, Math.floor(player.caps / price(id)))) : 1 })}
          />
        ))}
      </Crt>

      {deal && (
        <Modal title={mode === 'buy' ? 'Покупка' : 'Продажа'} onClose={() => setDeal(null)}>
          <div className="stack">
            <Crt>
              <ItemRow item={deal.item} sub={itemSummary(deal.item)} />
              <div className="small">{getItem(deal.item).description}</div>
            </Crt>
            <div className="row">
              <span className="grow">Количество</span>
              <Stepper
                value={deal.count}
                onDec={() => setDeal({ ...deal, count: deal.count - (ammo && deal.count > 10 ? 10 : 1) })}
                onInc={() => setDeal({ ...deal, count: Math.min(maxCount, deal.count + (ammo ? 10 : 1)) })}
                canDec={deal.count > 1}
                canInc={deal.count < maxCount}
              />
            </div>
            <div className="row">
              <span className="grow dim">Итого</span>
              <span className="amber">◉ {price(deal.item) * deal.count}</span>
            </div>
            <Button variant="primary" lamp block disabled={busy || (mode === 'buy' && player.caps < price(deal.item) * deal.count)} onClick={confirm}>
              {mode === 'buy' ? 'Купить' : 'Продать'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

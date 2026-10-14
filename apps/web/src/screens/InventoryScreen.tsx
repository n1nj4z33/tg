import { carryCapacity, getItem, inventoryWeight, type Item, type ItemId, type Player } from '@radclub/engine';
import { useState } from 'react';
import { ItemIcon } from '../art/ItemIcon.tsx';
import { ITEM_CATEGORY, itemSummary, kg } from '../game/format.ts';
import { usePlayerState } from '../state/GameProvider.tsx';
import { Bar, Button, Crt, ItemRow, Modal, Panel, Tabs } from '../ui/index.ts';

type Filter = 'all' | 'weapon' | 'armor' | 'consumable' | 'other';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Всё' },
  { value: 'weapon', label: 'Оружие' },
  { value: 'armor', label: 'Броня' },
  { value: 'consumable', label: 'Аптека' },
  { value: 'other', label: 'Прочее' },
];

const matches = (item: Item, f: Filter) => f === 'all' || item.type === f || (f === 'other' && ['ammo', 'junk', 'quest'].includes(item.type));

export const isEquipped = (p: Player, id: ItemId) => p.equipment.weapon === id || p.equipment.body === id || p.equipment.head === id;

/** Сортированный список предметов инвентаря — общий для инвентаря и продажи. */
export function inventoryList(p: Player, filter: Filter = 'all'): Array<[ItemId, number]> {
  const order: Item['type'][] = ['weapon', 'armor', 'consumable', 'ammo', 'junk', 'quest'];
  return Object.entries(p.inventory)
    .filter(([id]) => matches(getItem(id), filter))
    .sort(([a], [b]) => order.indexOf(getItem(a).type) - order.indexOf(getItem(b).type) || getItem(a).name.localeCompare(getItem(b).name));
}

export function InventoryScreen() {
  const { player, run, busy, state } = usePlayerState();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<ItemId | null>(null);
  const weight = inventoryWeight(player.inventory);
  const cap = carryCapacity(player);
  const list = inventoryList(player, filter);
  const item = open ? getItem(open) : null;
  const count = open ? (player.inventory[open] ?? 0) : 0;
  const locked = state.combat !== null;

  const act = async (action: Parameters<typeof run>[0], close = false) => {
    const res = await run(action);
    if (res && (close || !res.state.player?.inventory[open!])) setOpen(null);
  };

  return (
    <>
      <Panel title="Инвентарь">
        <div className="stack">
          <Bar label="Вес" kind={weight > cap ? 'over' : 'weight'} value={weight} max={cap} text={`${weight} / ${cap} кг`} />
          {weight > cap && <div className="small red">Перегруз! Нельзя путешествовать и идти вглубь зон.</div>}
          <Tabs value={filter} options={FILTERS} onChange={setFilter} />
        </div>
      </Panel>
      <Crt>
        {list.length === 0 && <div className="dim center">Пусто.</div>}
        {list.map(([id, n]) => (
          <ItemRow key={id} item={id} count={n} sub={itemSummary(id)} badge={isEquipped(player, id) ? 'Э' : undefined} onClick={() => setOpen(id)} />
        ))}
      </Crt>

      {item && open && (
        <Modal title={item.name} onClose={() => setOpen(null)}>
          <div className="stack">
            <Crt>
              <div className="row">
                <ItemIcon icon={item.icon} className="item-detail__icon" />
                <div className="grow">
                  <div className="small dim">{ITEM_CATEGORY[item.type]}</div>
                  <div>{item.description}</div>
                </div>
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                {itemSummary(open)}
              </div>
              <div className="small dim">
                В наличии: {count} · общий вес {kg(item.weight * count)} · цена {item.value}
              </div>
            </Crt>
            <div className="grid-2">
              {(item.type === 'weapon' || item.type === 'armor') &&
                (isEquipped(player, open) ? (
                  <Button disabled={busy || locked} onClick={() => act({ type: 'unequip', slot: item.type === 'weapon' ? 'weapon' : item.slot }, true)}>
                    Снять
                  </Button>
                ) : (
                  <Button variant="green" disabled={busy || locked} onClick={() => act({ type: 'equip', item: open }, true)}>
                    Надеть
                  </Button>
                ))}
              {item.type === 'consumable' && (
                <Button variant="green" disabled={busy || locked} onClick={() => act({ type: 'useItem', item: open })}>
                  Использовать
                </Button>
              )}
              {item.type !== 'quest' && (
                <Button variant="danger" disabled={busy || locked} onClick={() => act({ type: 'drop', item: open, count: 1 })}>
                  Выбросить 1
                </Button>
              )}
              {item.type !== 'quest' && count > 1 && (
                <Button variant="danger" disabled={busy || locked} onClick={() => act({ type: 'drop', item: open, count }, true)}>
                  Выбросить всё
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

import { allQuestViews, carryCapacity, inventoryWeight, maxHp, type GameState, type Player } from '@radclub/engine';
import { NavIcon, type NavIconKey } from '../art/NavIcon.tsx';
import { useGame, type Screen } from '../state/GameProvider.tsx';
import { Bar, cx } from '../ui/index.ts';

export function Hud({ player }: { player: Player }) {
  const weight = inventoryWeight(player.inventory);
  const cap = carryCapacity(player);
  return (
    <header className="hud">
      <div className="hud__name">
        {player.name} · ур. {player.level}
      </div>
      <div className="hud__caps" title="Крышки">
        ◉ {player.caps}
      </div>
      <div className="hud__bars">
        <Bar label="ОЗ" kind="hp" value={player.hp} max={maxHp(player)} />
        <Bar label={player.rads > 0 ? `Вес · ☢ ${player.rads}` : 'Вес'} kind={weight > cap ? 'over' : 'weight'} value={weight} max={cap} text={`${weight}/${cap}`} />
      </div>
    </header>
  );
}

const NAV: Array<{ screen: Screen; label: string; icon: NavIconKey }> = [
  { screen: 'hub', label: 'Локация', icon: 'location' },
  { screen: 'map', label: 'Карта', icon: 'map' },
  { screen: 'inventory', label: 'Вещи', icon: 'inventory' },
  { screen: 'character', label: 'Боец', icon: 'character' },
  { screen: 'quests', label: 'Задания', icon: 'quests' },
];

export function NavBar({ state }: { state: GameState }) {
  const { screen, go } = useGame();
  const p = state.player!;
  const dots: Partial<Record<Screen, boolean>> = {
    character: p.unspentSkillPoints + p.unspentStatPoints + p.unspentPerks > 0,
    quests: allQuestViews(state).some((q) => q.status === 'done'),
  };
  const active = screen === 'trader' || screen === 'arena' ? 'hub' : screen;
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <button key={n.screen} type="button" className={cx('nav__item', active === n.screen && 'nav__item--active')} onClick={() => go(n.screen)}>
          {dots[n.screen] && <span className="nav__dot" />}
          <NavIcon icon={n.icon} />
          {n.label}
        </button>
      ))}
    </nav>
  );
}

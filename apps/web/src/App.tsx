import { useEffect, useRef } from 'react';
import { ArenaScreen } from './screens/ArenaScreen.tsx';
import { CharacterScreen } from './screens/CharacterScreen.tsx';
import { CombatScreen } from './screens/CombatScreen.tsx';
import { CreateScreen } from './screens/CreateScreen.tsx';
import { HubScreen, ZoneScreen } from './screens/HubScreen.tsx';
import { InventoryScreen } from './screens/InventoryScreen.tsx';
import { MapScreen } from './screens/MapScreen.tsx';
import { QuestsScreen } from './screens/QuestsScreen.tsx';
import { Hud, NavBar } from './screens/Shell.tsx';
import { TraderScreen } from './screens/TraderScreen.tsx';
import { useGame, type Screen } from './state/GameProvider.tsx';
import { Toasts } from './ui/index.ts';
import './screens/screens.css';

function CurrentScreen({ screen, inZone }: { screen: Screen; inZone: boolean }) {
  switch (screen) {
    case 'map':
      return <MapScreen />;
    case 'inventory':
      return <InventoryScreen />;
    case 'character':
      return <CharacterScreen />;
    case 'quests':
      return <QuestsScreen />;
    case 'trader':
      return inZone ? <ZoneScreen /> : <TraderScreen />;
    case 'arena':
      return inZone ? <ZoneScreen /> : <ArenaScreen />;
    default:
      return inZone ? <ZoneScreen /> : <HubScreen />;
  }
}

export function App() {
  const { state, screen, go } = useGame();
  const bodyRef = useRef<HTMLElement>(null);
  const inCombat = Boolean(state?.combat);

  useEffect(() => bodyRef.current?.scrollTo(0, 0), [screen]);
  // После боя на арене возвращаемся к рингу, после остальных — в локацию.
  useEffect(() => {
    if (inCombat && screen !== 'arena') go('hub');
  }, [inCombat, screen, go]);

  let content;
  if (!state) content = <div className="loading">ЗАГРУЗКА ТЕРМИНАЛА…</div>;
  else if (!state.player) content = <CreateScreen />;
  else if (state.combat) content = <CombatScreen />;
  else
    content = (
      <div className="app">
        <Hud player={state.player} />
        <main className="app__body" ref={bodyRef}>
          <CurrentScreen screen={screen} inZone={state.expedition !== null} />
        </main>
        <NavBar state={state} />
      </div>
    );

  return (
    <>
      {content}
      <Toasts />
    </>
  );
}

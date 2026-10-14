import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { GameProvider } from './state/GameProvider.tsx';
import { initTelegram } from './telegram/telegram.ts';
import './styles/global.css';

initTelegram();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);

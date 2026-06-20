import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './ui/App';
import { ThemeProvider } from './theme/ThemeProvider';
import { startGame } from './game';

// Démarre la boucle de jeu (hors React) AVANT le rendu : React ne fait que s'abonner.
startGame();

const root = document.getElementById('root');
if (!root) throw new Error('#root introuvable');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

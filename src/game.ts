import { useStore } from './state/store';
import { loadGame, saveGame } from './state/save';
import { startLoop } from './core/loop';
import { offlineElapsedMs } from './core/time';
import { step } from './model/engine';
import Decimal from 'break_infinity.js';
import type { GameState } from './model/types';

// Orchestrateur : charge la save, rejoue la progression hors-ligne, démarre la boucle et l'autosave.
// Appelé une fois au démarrage par main.tsx. La logique de jeu vit dans engine.ts.

const AUTOSAVE_MS = 10_000;
const OFFLINE_STEP_S = 1; // pas plus grossier pour rejouer une longue absence rapidement

export interface OfflineRecap {
  elapsedMs: number;
  populationGain: Decimal;
}

let started = false;
let lastRecap: OfflineRecap | null = null;

/** Récap de la progression hors-ligne calculée au dernier démarrage (pour l'UI). */
export function getOfflineRecap(): OfflineRecap | null {
  return lastRecap;
}

export function startGame(): OfflineRecap | null {
  if (started) return null;
  started = true;

  let recap: OfflineRecap | null = null;
  const saved = loadGame();

  if (saved) {
    const elapsedMs = offlineElapsedMs(saved.lastSaved);
    const before = saved.resources.population.amount;
    let state: GameState = saved;
    let remaining = elapsedMs / 1000;
    while (remaining >= OFFLINE_STEP_S) {
      state = step(state, OFFLINE_STEP_S);
      remaining -= OFFLINE_STEP_S;
    }
    useStore.getState().hydrate(state);
    recap = { elapsedMs, populationGain: state.resources.population.amount.sub(before) };
    lastRecap = recap;
  }

  startLoop((dt) => useStore.getState().tick(dt));

  setInterval(() => saveGame(useStore.getState()), AUTOSAVE_MS);
  window.addEventListener('beforeunload', () => saveGame(useStore.getState()));

  return recap;
}

import type { Effect, GameState } from '../model/types';
import { asMix, energyMixEffects } from './energyMix';

// Effets déclaratifs contribués par le mini-jeu du tier courant (cf. architecture §11). Pur, sans
// React : l'engine l'appelle dans collectModifiers et n'a donc rien à savoir des mini-jeux.
export function minigameEffects(state: GameState): Effect[] {
  if (state.tier === 1) return energyMixEffects(asMix(state.minigame));
  return [];
}

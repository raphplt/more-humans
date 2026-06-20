import type { Effect } from '../model/types';

// Logique PURE du mini-jeu Tier II : le chantier orbital de l'essaim de Dyson (cf. 05_mechanics §3).
// Décision réelle : répartir l'effort de construction entre COLLECTEURS (boost énergie, pour viser
// le Type II) et HABITATS (boost capacité, pour faire vivre plus d'Humains hors-sol). Arbitrage.
// Communique avec le moteur uniquement via des effets déclaratifs. Chiffres = DRAFT.

export interface DysonYardState {
  energyFocus: number; // poids 0..100 vers les collecteurs (le reste va aux habitats)
}

export const DEFAULT_DYSON: DysonYardState = { energyFocus: 50 };
const DYSON_BONUS = 1.5; // amplitude max d'un côté ou de l'autre

export function asDyson(m: unknown): DysonYardState {
  if (m && typeof m === 'object') {
    const o = m as Record<string, unknown>;
    if (typeof o.energyFocus === 'number') {
      return { energyFocus: Math.min(100, Math.max(0, o.energyFocus)) };
    }
  }
  return DEFAULT_DYSON;
}

/** Part [0,1] de l'effort orientée vers l'énergie (collecteurs). */
export function energyShare(state: DysonYardState): number {
  return state.energyFocus / 100;
}

export function dysonEnergyMultiplier(state: DysonYardState): number {
  return 1 + energyShare(state) * DYSON_BONUS;
}

export function dysonCapacityMultiplier(state: DysonYardState): number {
  return 1 + (1 - energyShare(state)) * DYSON_BONUS;
}

export function dysonYardEffects(state: DysonYardState): Effect[] {
  return [
    { kind: 'multiplyProduction', resource: 'energy', factor: dysonEnergyMultiplier(state) },
    { kind: 'raiseCapacity', factor: dysonCapacityMultiplier(state) },
  ];
}

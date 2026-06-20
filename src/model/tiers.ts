import type { GameState } from './types';
import { TIERS } from '../data/tiers.data';
import { TECHS } from '../data/techs.data';

// Logique de palier Kardashev + conditions de transition. Cf. 01_ARCHITECTURE §3, 02 §1.

// Niveaux de tier verrouillés derrière une tech (transformation de phase explicite).
const GATED_TIERS = new Set<number>(
  TECHS.filter((t) => t.unlocksTierTransition !== undefined).map(
    (t) => t.unlocksTierTransition as number,
  ),
);

/**
 * Tier courant : on franchit le tier `t` dès que l'énergie atteint son seuil ET, si
 * le niveau suivant est gardé par une tech, que cette transition a été débloquée.
 */
export function computeTier(state: GameState, unlockedTierLevels: Set<number>): number {
  let tier = 0;
  for (const t of TIERS) {
    const threshold = t.energyThreshold;
    const energyOk = state.resources.energy.amount.gte(threshold);
    const next = t.level + 1;
    const gateOk = !GATED_TIERS.has(next) || unlockedTierLevels.has(next);
    if (energyOk && gateOk) {
      tier = next;
    } else {
      break;
    }
  }
  return tier;
}

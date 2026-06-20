import Decimal from 'break_infinity.js';
import type { GameState, GeneratorDef, ResourceId } from './types';
import { GENERATORS } from '../data/generators.data';

// Culling de phase (cf. content §collapse / 05_mechanics §5.2). Règle CENTRALISÉE, pas au cas par
// cas dans l'UI : un élément dont le tier est strictement inférieur au tier courant est « replié ».
// Garde la liste active et la charge cognitive bornées du début à la fin.

export function isCulled(elementTier: number, currentTier: number): boolean {
  return elementTier < currentTier;
}

/** Générateurs encore actifs (non cull-és) à ce tier. */
export function activeGenerators(state: GameState): GeneratorDef[] {
  return GENERATORS.filter((g) => !isCulled(g.tier, state.tier));
}

/** Générateurs repliés (tier précédent), pour un éventuel résumé « rente de fond ». */
export function culledGenerators(state: GameState): GeneratorDef[] {
  return GENERATORS.filter((g) => isCulled(g.tier, state.tier));
}

/** Production agrégée des générateurs repliés (résumé « ère précédente : +X/s »). */
export function culledProduction(state: GameState): Partial<Record<ResourceId, Decimal>> {
  const sum: Partial<Record<ResourceId, Decimal>> = {};
  for (const g of culledGenerators(state)) {
    const owned = state.owned[g.id] ?? 0;
    if (owned <= 0) continue;
    for (const [res, perUnit] of Object.entries(g.produces) as [ResourceId, Decimal][]) {
      sum[res] = (sum[res] ?? new Decimal(0)).add(perUnit.mul(owned));
    }
  }
  return sum;
}

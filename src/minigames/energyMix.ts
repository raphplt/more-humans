import type { Effect } from '../model/types';

// Logique PURE du mini-jeu Tier I (cf. 05_mechanics §3). Le module communique avec le moteur
// uniquement via des effets déclaratifs (mêmes `Effect` que le reste) — il ne touche pas l'engine.
//
// Décision réelle du joueur : répartir l'allocation entre sources, chacune avec un rendement et un
// plafond. Sur-investir une source au-delà de son plafond rend peu (rendements décroissants) :
// l'optimum est un MIX. Pure fossile = baseline 1.0 (pas de pénalité). Chiffres = DRAFT.

export interface EnergyMixState {
  fossil: number; // poids (entiers) ; normalisés à l'usage
  nuclear: number;
  renewable: number;
}

export type MixSourceId = keyof EnergyMixState;

export const DEFAULT_MIX: EnergyMixState = { fossil: 1, nuclear: 0, renewable: 0 };

export interface MixSource {
  id: MixSourceId;
  name: string;
  eff: number; // rendement
  cap: number; // part de mix au-delà de laquelle le rendement chute
  requires?: string; // tech qui débloque la source dans le mix
}

export const MIX_SOURCES: MixSource[] = [
  { id: 'fossil', name: 'Fossile', eff: 1.0, cap: 1.0 },
  { id: 'nuclear', name: 'Nucléaire', eff: 1.7, cap: 0.5, requires: 'electrification' },
  { id: 'renewable', name: 'Renouvelable', eff: 1.4, cap: 0.6, requires: 'renewables' },
];

/** Lit/valide un état de mix depuis `state.minigame` (forme opaque au cœur). */
export function asMix(m: unknown): EnergyMixState {
  if (m && typeof m === 'object') {
    const o = m as Record<string, unknown>;
    if (
      typeof o.fossil === 'number' &&
      typeof o.nuclear === 'number' &&
      typeof o.renewable === 'number'
    ) {
      return { fossil: o.fossil, nuclear: o.nuclear, renewable: o.renewable };
    }
  }
  return DEFAULT_MIX;
}

/** Parts normalisées (somme = 1). */
export function mixShares(mix: EnergyMixState): Record<MixSourceId, number> {
  const total = mix.fossil + mix.nuclear + mix.renewable;
  if (total <= 0) return { fossil: 1, nuclear: 0, renewable: 0 };
  return { fossil: mix.fossil / total, nuclear: mix.nuclear / total, renewable: mix.renewable / total };
}

/** Multiplicateur d'énergie résultant du mix (≈1 pour du fossile pur, jusqu'à ~1.4 bien réparti). */
export function energyMixMultiplier(mix: EnergyMixState): number {
  const shares = mixShares(mix);
  let m = 0;
  for (const s of MIX_SOURCES) {
    const a = shares[s.id];
    const within = Math.min(a, s.cap);
    const over = Math.max(0, a - s.cap);
    m += s.eff * (within + 0.25 * over); // au-delà du plafond : rendement à 25 %
  }
  return m > 0 ? m : 1;
}

export function energyMixEffects(mix: EnergyMixState): Effect[] {
  return [{ kind: 'multiplyProduction', resource: 'energy', factor: energyMixMultiplier(mix) }];
}

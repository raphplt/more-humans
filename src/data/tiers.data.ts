import type { TierDef } from '../model/types';
import { KARDASHEV_I, KARDASHEV_II, KARDASHEV_III } from './constants';
import Decimal from 'break_infinity.js';

export const TIERS: TierDef[] = [
  {
    level: 0,
    name: 'Aube',
    energyThreshold: new Decimal('1e13'), // industrialisation : porte vers le Tier I
    dominantActivity: 'Faire croître la population et débloquer les premières énergies.',
    capacityModel: 'capacity = base · f(énergie, techs agricoles) — la nourriture plafonne tout.',
  },
  {
    level: 1,
    name: 'Planétaire',
    energyThreshold: KARDASHEV_I, // ~10¹⁶ W
    dominantActivity: "Saturer l'énergie terrestre (fossile → nucléaire → fusion).",
    capacityModel: 'capacity ∝ énergie · efficacité — dominée par l’énergie, plus par la nourriture.',
  },
  {
    level: 2,
    name: 'Stellaire',
    energyThreshold: KARDASHEV_II, // ~3.8×10²⁶ W
    dominantActivity: 'Essaim de Dyson, habitats orbitaux, virage post-biologique.',
    capacityModel: 'capacity portée par le calcul (esprits) et l’espace orbital.',
  },
  {
    level: 3,
    name: 'Galactique',
    energyThreshold: KARDASHEV_III, // ~4×10³⁷ W
    dominantActivity: 'Expansion auto-réplicante, limites physiques réelles (endgame).',
    capacityModel: 'capacity bornée par Landauer / Bekenstein — racer l’entropie.',
  },
];

export function tierByLevel(level: number): TierDef | undefined {
  return TIERS.find((t) => t.level === level);
}

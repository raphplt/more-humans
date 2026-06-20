import Decimal from 'break_infinity.js';
import type { TechDef } from '../model/types';

// Mini arbre techno Tier 0 (gabarit). Cf. 02_PHASES_AND_CONTENT §3.
export const TECHS: TechDef[] = [
  {
    id: 'agriculture',
    tier: 0,
    name: 'Agriculture',
    description: 'Relève fortement la capacité de charge.',
    cost: { knowledge: new Decimal(40) },
    discover: { kind: 'resource', resource: 'knowledge', atLeast: new Decimal(15) },
    effects: [{ kind: 'raiseCapacity', factor: 2 }],
  },
  {
    id: 'writing',
    tier: 0,
    name: 'Écriture',
    description: 'Multiplie la production de savoir.',
    cost: { knowledge: new Decimal(120) },
    requires: ['agriculture'],
    effects: [{ kind: 'multiplyProduction', resource: 'knowledge', factor: 2 }],
  },
  {
    id: 'metallurgy',
    tier: 0,
    name: 'Métallurgie',
    description: "Débloque de meilleurs générateurs d'énergie.",
    cost: { knowledge: new Decimal(400) },
    requires: ['writing'],
    effects: [{ kind: 'unlockGenerator', id: 'coal_plant' }],
  },
  {
    id: 'steam_engine',
    tier: 0,
    name: 'Machine à vapeur',
    description: "Grand saut d'énergie ; ouvre la transition vers le Tier I.",
    cost: { knowledge: new Decimal(3000) },
    requires: ['metallurgy'],
    effects: [
      { kind: 'multiplyProduction', resource: 'energy', factor: 3 },
      { kind: 'unlockTier', level: 1 },
    ],
    unlocksTierTransition: 1,
  },

  // ---------- Tier I — Planétaire (cf. content §4) ----------
  {
    id: 'electrification',
    tier: 1,
    name: 'Électrification',
    description: "Réseau électrique : débloque le nucléaire et booste l'énergie.",
    cost: { knowledge: new Decimal('5e4') },
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 1.5 }],
  },
  {
    id: 'grid_optimization',
    tier: 1,
    name: 'Optimisation du réseau',
    description: "Multiplie l'efficacité énergétique globale.",
    cost: { knowledge: new Decimal('5e5') },
    requires: ['electrification'],
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 2 }],
  },
  {
    id: 'renewables',
    tier: 1,
    name: 'Renouvelables',
    description: 'Débloque solaire et éolien dans le mix énergétique.',
    cost: { knowledge: new Decimal('2e6') },
    requires: ['electrification'],
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 1.5 }],
  },
  {
    id: 'fusion',
    tier: 1,
    name: 'Fusion',
    description: 'Débloque le réacteur à fusion — porte de fin de Tier I.',
    cost: { knowledge: new Decimal('5e10') },
    requires: ['grid_optimization'],
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 3 }],
  },
  {
    id: 'rocketry',
    tier: 1,
    name: 'Astronautique',
    description: "Premiers pas vers l'espace — ouvre la transition vers le Tier II.",
    cost: { knowledge: new Decimal('5e11') },
    requires: ['fusion'],
    effects: [{ kind: 'unlockTier', level: 2 }],
    unlocksTierTransition: 2,
  },
];

export function techById(id: string): TechDef | undefined {
  return TECHS.find((t) => t.id === id);
}

import Decimal from 'break_infinity.js';
import type { UpgradeDef } from '../model/types';

// Améliorations INCRÉMENTALES : on monte le niveau, l'effet s'applique par niveau, le coût croît.
// Le clic actif se reporte ici. Au sein d'un tier elles se disputent le Savoir → vrai arbitrage
// (quel levier monter en priorité). Facteurs/niveau VOLONTAIREMENT modestes (ils composent) ; calés
// au banc (`npm run sim`).
export const UPGRADES: UpgradeDef[] = [
  // ---------- Tier 0 ----------
  {
    id: 'crop_rotation',
    tier: 0,
    name: 'Rotation des cultures',
    description: 'Chaque niveau relève la capacité de charge.',
    cost: { knowledge: new Decimal(60) },
    costGrowth: 1.8,
    unlock: { kind: 'tech', id: 'agriculture' },
    effects: [{ kind: 'raiseCapacity', factor: 1.04 }],
  },
  {
    id: 'granary',
    tier: 0,
    name: 'Greniers',
    description: 'Chaque niveau multiplie les Vivres produites.',
    cost: { knowledge: new Decimal(50) },
    costGrowth: 1.7,
    unlock: { kind: 'tech', id: 'agriculture' },
    effects: [{ kind: 'multiplyProduction', resource: 'food', factor: 1.1 }],
  },
  {
    id: 'apprenticeship',
    tier: 0,
    name: 'Apprentissage',
    description: 'Chaque niveau multiplie le savoir produit.',
    cost: { knowledge: new Decimal(150) },
    costGrowth: 1.9,
    unlock: { kind: 'tech', id: 'writing' },
    effects: [{ kind: 'multiplyProduction', resource: 'knowledge', factor: 1.08 }],
  },
  {
    id: 'toolmaking',
    tier: 0,
    name: 'Outillage',
    description: 'Chaque niveau multiplie la Matière produite.',
    cost: { knowledge: new Decimal(120) },
    costGrowth: 1.85,
    unlock: { kind: 'tech', id: 'metallurgy' },
    effects: [{ kind: 'multiplyProduction', resource: 'resources', factor: 1.08 }],
  },

  // ---------- Tier I ----------
  {
    id: 'mechanization',
    tier: 1,
    name: 'Mécanisation',
    description: 'Chaque niveau relève la capacité de charge.',
    cost: { knowledge: new Decimal('8e4') },
    costGrowth: 1.85,
    unlock: { kind: 'tier', atLeast: 1 },
    effects: [{ kind: 'raiseCapacity', factor: 1.05 }],
  },
  {
    id: 'assembly_line',
    tier: 1,
    name: 'Chaîne de montage',
    description: 'Chaque niveau multiplie la Matière produite.',
    cost: { knowledge: new Decimal('1e5') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 1 },
    effects: [{ kind: 'multiplyProduction', resource: 'resources', factor: 1.1 }],
  },
  {
    id: 'power_grid_tuning',
    tier: 1,
    name: 'Réglage du réseau',
    description: 'Chaque niveau multiplie la puissance.',
    cost: { knowledge: new Decimal('3e5') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 1 },
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 1.08 }],
  },
  {
    id: 'peer_review',
    tier: 1,
    name: 'Évaluation par les pairs',
    description: 'Chaque niveau multiplie le savoir produit.',
    cost: { knowledge: new Decimal('5e5') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 1 },
    effects: [{ kind: 'multiplyProduction', resource: 'knowledge', factor: 1.08 }],
  },

  // ---------- Tier II ----------
  {
    id: 'self_replication',
    tier: 2,
    name: 'Auto-réplication',
    description: 'Chaque niveau multiplie la Matière produite.',
    cost: { knowledge: new Decimal('1e10') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 2 },
    effects: [{ kind: 'multiplyProduction', resource: 'resources', factor: 1.1 }],
  },
  {
    id: 'swarm_tuning',
    tier: 2,
    name: 'Réglage de l’essaim',
    description: 'Chaque niveau multiplie la puissance captée.',
    cost: { knowledge: new Decimal('5e10') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 2 },
    effects: [{ kind: 'multiplyProduction', resource: 'energy', factor: 1.08 }],
  },
  {
    id: 'neural_compute',
    tier: 2,
    name: 'Calcul neuronal',
    description: 'Chaque niveau multiplie le savoir produit.',
    cost: { knowledge: new Decimal('1e11') },
    costGrowth: 1.9,
    unlock: { kind: 'tier', atLeast: 2 },
    effects: [{ kind: 'multiplyProduction', resource: 'knowledge', factor: 1.1 }],
  },
];

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

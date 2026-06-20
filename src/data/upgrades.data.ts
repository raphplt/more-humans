import Decimal from 'break_infinity.js';
import type { UpgradeDef } from '../model/types';

// Achats uniques modifiant des multiplicateurs/règles. Gabarit Tier 0.
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'crop_rotation',
    tier: 0,
    name: 'Rotation des cultures',
    description: 'Améliore durablement la capacité de charge.',
    cost: { knowledge: new Decimal(80) },
    unlock: { kind: 'tech', id: 'agriculture' },
    effects: [{ kind: 'raiseCapacity', factor: 1.5 }],
  },
  {
    id: 'apprenticeship',
    tier: 0,
    name: 'Apprentissage',
    description: 'La poussée active du clic est plus efficace.',
    cost: { knowledge: new Decimal(200) },
    unlock: { kind: 'tech', id: 'writing' },
    effects: [{ kind: 'multiplyClick', factor: 2 }],
  },
];

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

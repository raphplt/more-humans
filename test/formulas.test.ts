import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import type { GeneratorDef, UpgradeDef } from '../src/model/types';
import {
  canAfford,
  generatorBatchCost,
  generatorCost,
  isUnlocked,
  logisticDelta,
  upgradeBatchCost,
} from '../src/model/formulas';
import { initialState } from '../src/model/actions';

const def = (growth: number, base: Partial<Record<string, Decimal>>): GeneratorDef =>
  ({ id: 'x', tier: 0, name: 'x', description: '', produces: {}, baseCost: base, costGrowth: growth }) as GeneratorDef;

const upDef = (growth: number, cost: Partial<Record<string, Decimal>>): UpgradeDef =>
  ({ id: 'u', tier: 0, name: 'u', description: '', cost, costGrowth: growth, effects: [] }) as UpgradeDef;

describe('generatorBatchCost', () => {
  it('croissance 1 → coût linéaire base·n', () => {
    const cost = generatorBatchCost(def(1, { resources: new Decimal(100) }), 0, 5);
    expect(cost.resources!.eq(500)).toBe(true);
  });

  it('somme géométrique depuis owned=0', () => {
    const cost = generatorBatchCost(def(2, { resources: new Decimal(100) }), 0, 3);
    expect(cost.resources!.eq(700)).toBe(true); // (2^3-1)/(2-1) = 7
  });

  it('tient compte du nombre déjà possédé', () => {
    const cost = generatorBatchCost(def(2, { resources: new Decimal(100) }), 2, 1);
    expect(cost.resources!.eq(400)).toBe(true); // 2^2 · (2^1-1)/(2-1) = 4
  });

  it('generatorCost == batch n=1', () => {
    const d = def(1.18, { resources: new Decimal(50) });
    expect(generatorCost(d, 3).resources!.eq(generatorBatchCost(d, 3, 1).resources!)).toBe(true);
  });
});

describe('upgradeBatchCost (améliorations incrémentales)', () => {
  it('même somme géométrique, à partir du niveau courant', () => {
    expect(upgradeBatchCost(upDef(2, { knowledge: new Decimal(100) }), 0, 3).knowledge!.eq(700)).toBe(true);
    expect(upgradeBatchCost(upDef(2, { knowledge: new Decimal(100) }), 2, 1).knowledge!.eq(400)).toBe(true);
  });
});

describe('canAfford', () => {
  it('compare chaque ressource du coût au stock', () => {
    const s = initialState();
    s.resources.resources.amount = new Decimal(500);
    expect(canAfford(s, { resources: new Decimal(400) })).toBe(true);
    expect(canAfford(s, { resources: new Decimal(600) })).toBe(false);
  });
});

describe('logisticDelta', () => {
  it('nul à la capacité, positif en-dessous, négatif au-dessus', () => {
    expect(logisticDelta(new Decimal(100), new Decimal(100), 0.5, 1).eq(0)).toBe(true);
    expect(logisticDelta(new Decimal(50), new Decimal(100), 0.5, 1).gt(0)).toBe(true);
    expect(logisticDelta(new Decimal(150), new Decimal(100), 0.5, 1).lt(0)).toBe(true);
  });

  it('nul si capacité ≤ 0', () => {
    expect(logisticDelta(new Decimal(10), new Decimal(0), 0.5, 1).eq(0)).toBe(true);
  });
});

describe('isUnlocked', () => {
  it('undefined → toujours débloqué', () => {
    expect(isUnlocked(initialState(), undefined)).toBe(true);
  });

  it('tier / tech / resource / all', () => {
    const s = initialState();
    s.tier = 1;
    s.purchased = { metallurgy: true };
    s.resources.knowledge.amount = new Decimal(20);
    expect(isUnlocked(s, { kind: 'tier', atLeast: 1 })).toBe(true);
    expect(isUnlocked(s, { kind: 'tier', atLeast: 2 })).toBe(false);
    expect(isUnlocked(s, { kind: 'tech', id: 'metallurgy' })).toBe(true);
    expect(isUnlocked(s, { kind: 'tech', id: 'writing' })).toBe(false);
    expect(isUnlocked(s, { kind: 'resource', resource: 'knowledge', atLeast: new Decimal(10) })).toBe(true);
    expect(isUnlocked(s, { kind: 'resource', resource: 'knowledge', atLeast: new Decimal(30) })).toBe(false);
    expect(
      isUnlocked(s, { kind: 'all', of: [{ kind: 'tier', atLeast: 1 }, { kind: 'tech', id: 'metallurgy' }] }),
    ).toBe(true);
    expect(
      isUnlocked(s, { kind: 'all', of: [{ kind: 'tier', atLeast: 1 }, { kind: 'tech', id: 'writing' }] }),
    ).toBe(false);
  });
});

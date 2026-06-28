import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import { computeTier } from '../src/model/tiers';
import { initialState } from '../src/model/actions';

const withEnergy = (e: string) => {
  const s = initialState();
  s.resources.energy.amount = new Decimal(e);
  return s;
};

describe('computeTier', () => {
  it('franchit le Tier I dès 1e13 W si la transition est débloquée', () => {
    expect(computeTier(withEnergy('2e13'), new Set([1, 2]))).toBe(1);
  });

  it('reste gated tant que la tech de transition n’est pas prise', () => {
    expect(computeTier(withEnergy('5e16'), new Set())).toBe(0);
  });

  it('atteint le Tier II à Kardashev I (1e16 W) avec les transitions débloquées', () => {
    expect(computeTier(withEnergy('5e16'), new Set([1, 2]))).toBe(2);
  });

  it('la fin (Tier III) à Kardashev II (3.8e26 W) n’est pas gated par une tech', () => {
    expect(computeTier(withEnergy('5e26'), new Set([1, 2]))).toBe(3);
  });

  it('énergie insuffisante → reste au tier courant', () => {
    expect(computeTier(withEnergy('1e10'), new Set([1, 2]))).toBe(0);
  });
});

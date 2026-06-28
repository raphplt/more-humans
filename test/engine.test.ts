import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import {
  clickRegime,
  computeFlows,
  reproductionUnlocked,
  step,
  BOOTSTRAP_DONE,
} from '../src/model/engine';
import { initialState } from '../src/model/actions';

describe('clickRegime', () => {
  it('amorçage sous le seuil, pilotage au-dessus', () => {
    const s = initialState();
    expect(clickRegime(s)).toBe('bootstrap');
    s.resources.population.amount = BOOTSTRAP_DONE.sub(1);
    expect(clickRegime(s)).toBe('bootstrap');
    s.resources.population.amount = BOOTSTRAP_DONE;
    expect(clickRegime(s)).toBe('drive');
  });
});

describe('reproductionUnlocked', () => {
  it('nécessite au moins une ferme', () => {
    const s = initialState();
    expect(reproductionUnlocked(s)).toBe(false);
    s.owned = { farmland: 1 };
    expect(reproductionUnlocked(s)).toBe(true);
  });
});

describe('énergie = puissance dérivée', () => {
  it('somme des sorties × multiplicateurs', () => {
    const s = initialState();
    s.owned = { woodfire: 2 };
    expect(computeFlows(s).energy.eq(2000)).toBe(true);
    s.purchased = { steam_engine: true }; // ×3 énergie
    s.owned = { woodfire: 1 };
    expect(computeFlows(s).energy.eq(3000)).toBe(true);
  });

  it('FIXÉE chaque tick, jamais accumulée', () => {
    const s = initialState();
    s.owned = { woodfire: 2 };
    const s1 = step(s, 1);
    const s2 = step(s1, 1);
    expect(s1.resources.energy.amount.eq(2000)).toBe(true);
    expect(s2.resources.energy.amount.eq(2000)).toBe(true);
  });
});

describe('capacité', () => {
  it('vaut la base sans énergie ni effets', () => {
    expect(computeFlows(initialState()).capacity.eq(25)).toBe(true);
  });

  it('croît avec la puissance harnachée', () => {
    const low = initialState();
    low.owned = { woodfire: 1 };
    const high = initialState();
    high.owned = { coal_plant: 50 };
    expect(computeFlows(high).capacity.gt(computeFlows(low).capacity)).toBe(true);
  });
});

describe('step', () => {
  it('produit un nouvel objet (refs fraîches)', () => {
    const s = initialState();
    const next = step(s, 0.1);
    expect(next).not.toBe(s);
    expect(next.resources).not.toBe(s.resources);
  });

  it('les Vivres s’accumulent (monnaie), pas l’énergie', () => {
    const s = initialState();
    s.resources.population.amount = new Decimal(100);
    const next = step(s, 1);
    expect(next.resources.food.amount.gt(s.resources.food.amount)).toBe(true);
  });
});

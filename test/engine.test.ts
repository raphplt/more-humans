import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import { clickRegime, computeFlows, step, BOOTSTRAP_DONE } from '../src/model/engine';
import { applyBuyUpgrade, initialState } from '../src/model/actions';

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

describe('capacité (Cap_sustain)', () => {
  it('vaut FORAGE_BASE/EAT ≈ 25 sans énergie, cultivation ni effets', () => {
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

describe('améliorations incrémentales', () => {
  it('monte le niveau, déduit le coût, applique l’effet par niveau', () => {
    const s = initialState();
    s.purchased = { writing: true };
    s.resources.population.amount = new Decimal(1000); // sinon production de savoir nulle
    s.resources.knowledge.amount = new Decimal(1000);
    const base = computeFlows(s).knowledge;

    const s1 = applyBuyUpgrade(s, 'apprenticeship'); // ×1.15 savoir / niveau, coût 150
    expect(s1.upgradeLevels['apprenticeship']).toBe(1);
    expect(s1.resources.knowledge.amount.eq(850)).toBe(true);

    const s2 = applyBuyUpgrade(s1, 'apprenticeship');
    expect(s2.upgradeLevels['apprenticeship']).toBe(2);
    expect(computeFlows(s2).knowledge.gt(base)).toBe(true);
  });

  it('no-op si non débloquée', () => {
    const s = initialState();
    s.resources.knowledge.amount = new Decimal(1000);
    expect(applyBuyUpgrade(s, 'apprenticeship')).toBe(s); // writing non acquis
  });
});

describe('step', () => {
  it('produit un nouvel objet (refs fraîches)', () => {
    const s = initialState();
    const next = step(s, 0.1);
    expect(next).not.toBe(s);
    expect(next.resources).not.toBe(s.resources);
  });

  it('le tampon de Vivres se remplit sous le plafond, pas l’énergie', () => {
    const s = initialState();
    s.resources.population.amount = new Decimal(10); // P < Cap_sustain (25) → Fprod > Fcons
    const next = step(s, 1);
    expect(next.resources.food.amount.gt(s.resources.food.amount)).toBe(true);
    expect(next.resources.energy.amount.eq(0)).toBe(true);
  });
});

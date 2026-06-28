import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import type { GameState } from '../src/model/types';
import { computeDiscovered, computeFlows, step } from '../src/model/engine';
import { generatorBatchCost } from '../src/model/formulas';
import { applyClick, initialState } from '../src/model/actions';
import { generatorById } from '../src/data/generators.data';
import { formatFull } from '../src/format/notation';

// ── Couche 1 du harnais d'acceptation (cf. 03 §1). Chaque bloc ↔ un invariant de 01 §9. États
// FORGÉS à la main (rapides, lisibles), pas des parties complètes. Le couteau malthusien doit
// avoir une ÂME : famine atteignable, sur-investissement stérile, reprise possible. ──

const DT = 0.1;

/** Avance `state` de `ticks` pas fixes. */
function run(state: GameState, ticks: number): GameState {
  let s = state;
  for (let i = 0; i < ticks; i++) s = step(s, DT);
  return s;
}

/** État forgé : départ neutre + surcharges. */
function forge(over: Partial<GameState>): GameState {
  return { ...initialState(), ...over };
}

const growth = { growth: 1, capacity: 0 };
const capacityOnly = { growth: 0, capacity: 1 };

const pop = (s: GameState) => s.resources.population.amount;
const food = (s: GameState) => s.resources.food.amount;

describe('U1 — amorçage strict (01 §9.1)', () => {
  it('P=0 sans bande ni clic → P reste 0', () => {
    const after = run(initialState(), 600); // 60 s
    expect(pop(after).eq(0)).toBe(true);
  });

  it('un clic (amorçage) fait naître des Humains', () => {
    const s = applyClick(initialState());
    expect(pop(s).gt(0)).toBe(true);
  });

  it('une bande de chasseurs (terme A) fait croître P depuis 0', () => {
    const s = forge({ owned: { hunting_band: 1 } });
    const after = run(s, 100);
    expect(pop(after).gt(0)).toBe(true);
  });
});

describe('U2 — famine atteignable (01 §9.2)', () => {
  it('curseur Croissance, plafond négligé → le tampon se vide ET P chute', () => {
    let s = forge({
      resources: {
        ...initialState().resources,
        population: { amount: new Decimal(200) }, // bien au-dessus de Cap_sustain (25)
        food: { amount: new Decimal(10) }, // tampon presque vide
      },
      allocation: growth,
    });

    // On avance jusqu'à ce que le tampon soit vide.
    let drained = false;
    for (let i = 0; i < 2000 && !drained; i++) {
      s = step(s, DT);
      if (food(s).lte(0)) drained = true;
    }
    expect(drained).toBe(true);

    // Tampon vide → la population DESCEND (le tabou est brisé).
    const before = pop(s);
    const next = step(s, DT);
    expect(pop(next).lt(before)).toBe(true);
  });
});

describe('U3 — sur-investissement stérile (01 §9.3)', () => {
  it('curseur Capacité (c=1) → naissances ≈ 0 mais Cap_sustain monte', () => {
    const s = forge({
      resources: {
        ...initialState().resources,
        population: { amount: new Decimal(100) },
        food: { amount: new Decimal(1e6) }, // gros tampon → pas de famine parasite
      },
      allocation: capacityOnly,
    });
    const capBefore = computeFlows(s).capacity;
    const after = run(s, 600); // 60 s
    const capAfter = computeFlows(after).capacity;

    expect(pop(after).sub(pop(s)).abs().lt(1e-6)).toBe(true); // P stagne
    expect(capAfter.gt(capBefore)).toBe(true); // le plafond, lui, monte
  });
});

describe('U4 — monotonie hors famine (01 §9.6)', () => {
  it('si S>0 et P≤Cap_sustain sur toute la trajectoire, P ne décroît jamais', () => {
    let s = forge({
      resources: {
        ...initialState().resources,
        population: { amount: new Decimal(100) },
        food: { amount: new Decimal(1e6) },
      },
      cultivation: new Decimal(1e6), // Cap_sustain ≈ 1e6, très au-dessus de P
      allocation: growth,
    });
    let prev = pop(s);
    for (let i = 0; i < 600; i++) {
      s = step(s, DT);
      const f = computeFlows(s);
      // préconditions de l'invariant
      expect(food(s).gt(0)).toBe(true);
      expect(pop(s).lte(f.capacity)).toBe(true);
      // conclusion : monotonie
      expect(pop(s).gte(prev)).toBe(true);
      prev = pop(s);
    }
  });
});

describe('U5 — récupérable (01 §9.5)', () => {
  it('après famine, curseur Capacité → S repasse >0, P repart ; plancher >0, jamais 0', () => {
    // État post-famine : tampon vide, pop au-dessus du plafond.
    let s = forge({
      resources: {
        ...initialState().resources,
        population: { amount: new Decimal(120) },
        food: { amount: new Decimal(0) },
      },
      allocation: capacityOnly, // on bascule sur la capacité pour se rétablir
    });

    let minPop = pop(s);
    let refilled = false;
    for (let i = 0; i < 60000; i++) {
      // jusqu'à ~100 min simulées
      s = step(s, DT);
      const p = pop(s);
      if (p.lt(minPop)) minPop = p;
      if (food(s).gt(1)) {
        refilled = true;
        break;
      }
    }
    expect(refilled).toBe(true); // le tampon se reremplit (la capacité a rattrapé la pop)
    expect(minPop.gt(0)).toBe(true); // jamais zéro : pas de spirale de mort

    // Le plafond devant la pop, on reconvertit le curseur vers la Croissance → P repart.
    s = { ...s, allocation: growth };
    const reboundStart = pop(s);
    const after = run(s, 600);
    expect(pop(after).gt(reboundStart)).toBe(true);
  });
});

describe('U6 — pureté & déterminisme (01 §9.7)', () => {
  it('step ne mute pas l’entrée', () => {
    const s = forge({ resources: { ...initialState().resources, population: { amount: new Decimal(50) } } });
    const snapshot = pop(s).toString();
    step(s, DT);
    expect(pop(s).toString()).toBe(snapshot);
  });

  it('deux appels identiques → mêmes valeurs (déterministe)', () => {
    const s = forge({
      resources: { ...initialState().resources, population: { amount: new Decimal(73) } },
      cultivation: new Decimal(42),
    });
    const a = step(s, DT);
    const b = step(s, DT);
    expect(pop(a).toString()).toBe(pop(b).toString());
    expect(a.capacity.toString()).toBe(b.capacity.toString());
    expect(a.cultivation.toString()).toBe(b.cultivation.toString());
  });

  it('aucun NaN/Infinity après un tick', () => {
    const s = forge({
      resources: { ...initialState().resources, population: { amount: new Decimal(500) }, food: { amount: new Decimal(0) } },
      allocation: growth,
    });
    const next = step(s, DT);
    for (const r of Object.values(next.resources)) {
      expect(Number.isFinite(r.amount.toNumber())).toBe(true);
    }
    expect(Number.isFinite(next.capacity.toNumber())).toBe(true);
    expect(Number.isFinite(next.cultivation.toNumber())).toBe(true);
  });
});

describe('U7 — discipline Decimal (claude.md)', () => {
  it('toutes les grandeurs sont des Decimal après step', () => {
    const next = step(initialState(), DT);
    for (const r of Object.values(next.resources)) {
      expect(r.amount instanceof Decimal).toBe(true);
    }
    expect(next.capacity instanceof Decimal).toBe(true);
    expect(next.cultivation instanceof Decimal).toBe(true);
    expect(next.clickPower instanceof Decimal).toBe(true);
    expect(next.drive instanceof Decimal).toBe(true);
  });
});

describe('U8 — notation pleine (01, architecture §6)', () => {
  it('un grand Decimal de pop se formate sans exposant', () => {
    let s = forge({
      resources: { ...initialState().resources, population: { amount: new Decimal('1e7') } },
      cultivation: new Decimal('1e9'),
      allocation: growth,
    });
    s = run(s, 50);
    const out = formatFull(pop(s));
    expect(/\d[eE][+-]?\d/.test(out)).toBe(false);
  });
});

describe('U9 — révélation = absence (02 §4)', () => {
  it('un élément dont la condition n’est pas remplie est ABSENT (pas grisé)', () => {
    const d = computeDiscovered(initialState());
    // farmland se révèle à P≥60 : à P=0 il n'est pas dans la carte des révélés.
    expect(d['farmland']).toBeUndefined();
  });

  it('révélé une fois la condition remplie (monotone)', () => {
    const s = forge({ resources: { ...initialState().resources, population: { amount: new Decimal(60) } } });
    const d = computeDiscovered(s);
    expect(d['farmland']).toBe(true);
  });

  it('coût d’un lot = somme géométrique (achat groupé, jamais une boucle)', () => {
    const band = generatorById('hunting_band')!;
    const g = band.costGrowth;
    const unit = band.baseCost.food!;
    const cost = generatorBatchCost(band, 0, 3).food!;
    const expected = unit.mul(1 + g + g * g);
    expect(cost.sub(expected).abs().lt(1e-6)).toBe(true);
  });
});

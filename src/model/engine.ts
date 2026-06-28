import Decimal from 'break_infinity.js';
import type { ClickRegime, Effect, GameState, ResourceId } from './types';
import {
  births,
  capSustain,
  cultivationGain,
  famineDeaths,
  foodConsumption,
  foodProduction,
  isUnlocked,
} from './formulas';
import { computeTier } from './tiers';
import { GENERATORS } from '../data/generators.data';
import { TECHS } from '../data/techs.data';
import { UPGRADES } from '../data/upgrades.data';
import { minigameEffects } from '../minigames/effects';

// engine.ts applique UN tick à pas fixe. Cœur de l'Âge 0 = le COUTEAU MALTHUSIEN (cf. 01) :
// un curseur ventile l'effort entre CROÎTRE (naissances pilotées ∝ P) et ÉLEVER LE PLAFOND
// (défrichage → Cultivation → Vivres → Cap_sustain). Chaque Humain CONSOMME des Vivres ; le tampon
// de Vivres (S) absorbe le déficit, et VIDE (S≤0) il y a FAMINE : la population CHUTE. Tout en Decimal.

// --- Constantes d'équilibrage (DRAFT, calées au banc `npm run sim`, cf. 01 §7) ---
const EAT = 0.1; // Vivres consommées /hab/s
const FORAGE_BASE = 2.5; // Vivres/s du territoire à P=0 (FORAGE_BASE/EAT ≈ 25 hab. « gratis »)
const YIELD = 0.1; // Vivres/s par point de Cultivation
const CLEAR = 0.006; // Cultivation défrichée /s par hab. du côté « capacité » (calé au banc)
const BIRTH = 0.01; // taux de naissance malthusien max (à g=1) /s (calé au banc)
const FAMINE = 0.05; // coefficient de décès quand le tampon est vide
const CAPACITY_ENERGY_SCALE = new Decimal('3.2e13'); // l'énergie ne dope Cap_sustain qu'aux échelles Kardashev
const KNOWLEDGE_PER_CAPITA = new Decimal('1e-4'); // savoir passif/hab./s
const DRIVE_DECAY_PER_S = 0.5; // la surpoussée du clic retombe

/** Seuil de bascule amorçage → pilotage (cf. 01 §5). Draft. */
export const BOOTSTRAP_DONE = new Decimal(500);

/** Régime du clic, dérivé de l'état (monotone : une fois en 'drive', on y reste de fait). */
export function clickRegime(state: GameState): ClickRegime {
  return state.resources.population.amount.gte(BOOTSTRAP_DONE) ? 'drive' : 'bootstrap';
}

// --- Modificateurs agrégés (effets actifs) ---
export interface ActiveModifiers {
  capacityFactor: Decimal;
  foodCeilingBonus: Decimal; // fermes/agriculture : relèvent le plafond de nourriture
  productionMult: Record<ResourceId, Decimal>;
  clickMult: Decimal;
  unlockedTierLevels: Set<number>;
}

function applyEffect(mods: ActiveModifiers, e: Effect, times: number): void {
  switch (e.kind) {
    case 'raiseCapacity':
      mods.capacityFactor = mods.capacityFactor.mul(Decimal.pow(e.factor, times));
      break;
    case 'raiseFoodCeiling':
      mods.foodCeilingBonus = mods.foodCeilingBonus.add(new Decimal(e.amount).mul(times));
      break;
    case 'multiplyProduction':
      mods.productionMult[e.resource] = mods.productionMult[e.resource].mul(
        Decimal.pow(e.factor, times),
      );
      break;
    case 'multiplyClick':
      mods.clickMult = mods.clickMult.mul(Decimal.pow(e.factor, times));
      break;
    case 'unlockTier':
      mods.unlockedTierLevels.add(e.level);
      break;
    case 'unlockGenerator':
      break;
  }
}

export function collectModifiers(state: GameState): ActiveModifiers {
  const mods: ActiveModifiers = {
    capacityFactor: new Decimal(1),
    foodCeilingBonus: new Decimal(0),
    productionMult: {
      population: new Decimal(1),
      food: new Decimal(1),
      resources: new Decimal(1),
      energy: new Decimal(1),
      knowledge: new Decimal(1),
    },
    clickMult: new Decimal(1),
    unlockedTierLevels: new Set<number>(),
  };

  for (const tech of TECHS) {
    if (state.purchased[tech.id]) for (const e of tech.effects) applyEffect(mods, e, 1);
  }
  for (const up of UPGRADES) {
    const level = state.upgradeLevels[up.id] ?? 0;
    if (level > 0) for (const e of up.effects) applyEffect(mods, e, level);
  }
  for (const gen of GENERATORS) {
    const owned = state.owned[gen.id] ?? 0;
    if (owned > 0 && gen.effects) for (const e of gen.effects) applyEffect(mods, e, owned);
  }
  for (const e of minigameEffects(state)) applyEffect(mods, e, 1);
  return mods;
}

/** Production brute par seconde des GÉNÉRATEURS (bâtiments) — hors allocation de population. */
function generatorProduction(state: GameState): Record<ResourceId, Decimal> {
  const prod: Record<ResourceId, Decimal> = {
    population: new Decimal(0),
    food: new Decimal(0),
    resources: new Decimal(0),
    energy: new Decimal(0),
    knowledge: new Decimal(0),
  };
  for (const gen of GENERATORS) {
    const owned = state.owned[gen.id] ?? 0;
    if (owned <= 0) continue;
    for (const [res, perUnit] of Object.entries(gen.produces) as [ResourceId, Decimal][]) {
      prod[res] = prod[res].add(perUnit.mul(owned));
    }
  }
  return prod;
}

/** Débits par seconde courants — partagés par `step` (×dt) et `rates` (affichage UI). */
export interface Flows {
  mods: ActiveModifiers;
  capacity: Decimal; // Cap_sustain = pop soutenable (Fprod/EAT)
  foodProduction: Decimal; // Fprod : Vivres produites/s
  foodConsumption: Decimal; // Fcons : Vivres consommées/s (P·EAT)
  food: Decimal; // net Vivres/s = Fprod − Fcons (peut être négatif → le tampon S se vide)
  cultivation: Decimal; // défrichage/s (accumulé dans `state.cultivation`)
  resources: Decimal; // Matière/s
  knowledge: Decimal;
  energy: Decimal; // PUISSANCE instantanée (W) — pas un débit accumulé (cf. step : on la fixe)
  population: Decimal; // croissance nette/s (naissances − décès ; PEUT être < 0 en famine)
}

export function computeFlows(state: GameState): Flows {
  const mods = collectModifiers(state);
  const pop = state.resources.population.amount;

  // Le COUTEAU : curseur c ∈ [0,1] (part capacité), g = 1 − c (part croissance).
  const total = Math.max(1e-9, state.allocation.growth + state.allocation.capacity);
  const c = Math.max(0, Math.min(1, state.allocation.capacity / total));
  const g = 1 - c;

  const gen = generatorProduction(state);

  // Surpoussée du clic (pilotage), appliquée au SEUL côté désigné par le curseur (driveTarget).
  const driveBoost = new Decimal(1).add(state.drive);
  const growthBoost = state.driveTarget === 'growth' ? driveBoost : new Decimal(1);
  const capacityBoost = state.driveTarget === 'capacity' ? driveBoost : new Decimal(1);

  // ÉNERGIE = PUISSANCE instantanée harnachée (W), PAS un stock accumulé/dépensable. Somme des
  // sorties des générateurs × multiplicateurs ; recalculée chaque tick ; porte Kardashev.
  const energy = gen.energy.mul(mods.productionMult.energy);

  // Aux échelles Kardashev l'énergie généralise le plafond (nourriture → énergie). Négligeable au
  // néolithique (energyFactor ≈ 1), dominante au Tier I+. Cf. 01 §10.
  const energyFactor = energy.div(CAPACITY_ENERGY_SCALE).add(1);

  // Vivres produites (le plafond nourricier) : territoire + cultivation·YIELD + fermes (foodCeiling)
  // + générateurs. raiseCapacity (agriculture/techs) et l'énergie multiplient Cap_sustain.
  const foodMult = mods.productionMult.food.mul(energyFactor).mul(mods.capacityFactor);
  const foodProd = foodProduction(FORAGE_BASE, state.cultivation, YIELD, gen.food, mods.foodCeilingBonus, foodMult);
  const capacity = capSustain(foodProd, EAT);

  // Tampon de Vivres S : dS = Fprod − Fcons (peut être négatif → S draine, plancher 0 dans `step`).
  const foodCons = foodConsumption(pop, EAT);
  const netFood = foodProd.sub(foodCons);

  // Défrichage : la part « capacité » du curseur accumule de la Cultivation.
  const dCultivation = cultivationGain(pop, c, CLEAR, capacityBoost);

  // Matière : HORS Âge 0 (curseur binaire) — provient désormais des seuls générateurs (rampe).
  const matiere = gen.resources.mul(mods.productionMult.resources);
  const knowledge = pop
    .mul(KNOWLEDGE_PER_CAPITA)
    .add(gen.knowledge)
    .mul(mods.productionMult.knowledge);

  // Population : naissances pilotées (A + g·BIRTH·P) − décès de famine (UNIQUEMENT si S ≤ 0).
  const additiveA = gen.population.mul(mods.productionMult.population);
  const born = births(additiveA, pop, g, BIRTH, growthBoost);
  const starving = state.resources.food.amount.lte(0);
  const deaths = starving ? famineDeaths(foodCons, foodProd, EAT, FAMINE) : new Decimal(0);
  const population = born.sub(deaths); // ⚠ peut être < 0 (famine)

  return {
    mods,
    capacity,
    foodProduction: foodProd,
    foodConsumption: foodCons,
    food: netFood,
    cultivation: dCultivation,
    resources: matiere,
    knowledge,
    energy,
    population,
  };
}

/** Débits /s pour l'UI (mêmes calculs que le tick). */
export function rates(state: GameState): Flows {
  return computeFlows(state);
}

/** Condition d'apparition (révélation) ; défaut = condition d'achat. */
function discoverCondMet(
  state: GameState,
  tier: number,
  discover: Parameters<typeof isUnlocked>[1],
  unlock: Parameters<typeof isUnlocked>[1],
  requiresOk = true,
): boolean {
  if (state.tier < tier) return false;
  if (!requiresOk) return false;
  return isUnlocked(state, discover ?? unlock);
}

/** Met à jour la carte des éléments RÉVÉLÉS (monotone). */
export function computeDiscovered(state: GameState): Record<string, boolean> {
  const d = { ...state.discovered };
  for (const g of GENERATORS) {
    if (!d[g.id] && discoverCondMet(state, g.tier, g.discover, g.unlock)) d[g.id] = true;
  }
  for (const u of UPGRADES) {
    if (!d[u.id] && discoverCondMet(state, u.tier, u.discover, u.unlock)) d[u.id] = true;
  }
  for (const t of TECHS) {
    const requiresOk = (t.requires ?? []).every((r) => state.purchased[r]);
    if (!d[t.id] && discoverCondMet(state, t.tier, t.discover, undefined, requiresOk)) {
      d[t.id] = true;
    }
  }
  return d;
}

/** Capacité de population courante (limite à laquelle clic et reproduction sont bornés). */
export function capacityOf(state: GameState): Decimal {
  return computeFlows(state).capacity;
}

/** Avance l'état d'un pas fixe `dt` (s). Retourne un NOUVEL objet (refs fraîches pour React). */
export function step(state: GameState, dt: number): GameState {
  const f = computeFlows(state);

  const addStock = (cur: Decimal, perSec: Decimal): Decimal => {
    const next = cur.add(perSec.mul(dt));
    return next.lt(0) ? new Decimal(0) : next;
  };

  // La population PEUT chuter (famine) : `f.population < 0` draine le compte, planché à 0 par
  // addStock (en pratique elle se stabilise vers Cap_sustain, cf. 01 §4). Le tampon de Vivres S
  // accumule dS (planché 0 = vide). L'énergie est une PUISSANCE (W) : on la FIXE, on ne l'accumule
  // pas. La Cultivation ne fait que monter (terre défrichée). Les autres sont des stocks ×dt.
  const next: GameState = {
    ...state,
    resources: {
      population: { amount: addStock(state.resources.population.amount, f.population) },
      food: { amount: addStock(state.resources.food.amount, f.food) },
      resources: { amount: addStock(state.resources.resources.amount, f.resources) },
      knowledge: { amount: addStock(state.resources.knowledge.amount, f.knowledge) },
      energy: { amount: f.energy },
    },
    capacity: f.capacity,
    cultivation: state.cultivation.add(f.cultivation.mul(dt)),
    drive: state.drive.mul(Math.pow(DRIVE_DECAY_PER_S, dt)),
  };

  next.tier = computeTier(next, f.mods.unlockedTierLevels);
  next.discovered = computeDiscovered(next);
  return next;
}

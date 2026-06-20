import Decimal from 'break_infinity.js';
import type { ClickRegime, Effect, GameState, ResourceId } from './types';
import { isUnlocked, logisticDelta } from './formulas';
import { computeTier } from './tiers';
import { GENERATORS } from '../data/generators.data';
import { TECHS } from '../data/techs.data';
import { UPGRADES } from '../data/upgrades.data';
import { minigameEffects } from '../minigames/effects';

// engine.ts applique UN tick à pas fixe. Cœur du Tier 0 = la BOUCLE DE SUBSISTANCE :
// la population est répartie (allocation) entre CUEILLETTE (→ Vivres) et LABEUR (→ Matière) ;
// chaque Humain CONSOMME des Vivres ; la cueillette sauvage est PLAFONNÉE → il faut des fermes.
// Cf. design-revelation-core / boucle de jeu. Tout est en Decimal.

// --- Constantes d'équilibrage (DRAFT, calées au banc `npm run sim`, cf. sim-bench) ---
// Modèle : boucle COMPOSÉE sans plafond dur. Les Vivres sont une monnaie qui croît avec la pop
// (pas de consommation/famine qui l'étrangle). Les fermes relèvent la CAPACITÉ (limite de pop) ;
// la pop grandit vers la capacité ; le revenu de Vivres compose → on peut toujours acheter le
// suivant, ça prend juste plus de temps. JAMAIS de cap codé en dur.
const FOOD_BASE = new Decimal(1); // revenu de Vivres de base du territoire (pop = 0)
const FORAGE_RATE = 0.07; // Vivres produits par cueilleur/s (revenu modeste, NON plafonné)
const LABOR_RATE = 0.07; // Matière produite par laboureur/s
const BASE_POP_CAP = new Decimal(25); // capacité initiale (avant fermes) — plafonne le clic (fondation)
const CAPACITY_ENERGY_SCALE = new Decimal('1e12'); // l'énergie ne dope la capacité qu'aux échelles Kardashev
const KNOWLEDGE_PER_CAPITA = new Decimal('1e-4'); // savoir passif/hab./s
const BASE_GROWTH_RATE = 0.005; // r de la logistique — n'agit qu'après l'agriculture
const DRIVE_DECAY_PER_S = 0.5; // la poussée du clic retombe

/** Seuil de bascule amorçage → pilotage (cf. 05_mechanics §1.3). Draft. */
export const BOOTSTRAP_DONE = new Decimal(500);

/** Régime du clic, dérivé de l'état (monotone : une fois en 'drive', on y reste de fait). */
export function clickRegime(state: GameState): ClickRegime {
  return state.resources.population.amount.gte(BOOTSTRAP_DONE) ? 'drive' : 'bootstrap';
}

/**
 * La reproduction (croissance logistique automatique) ne s'active qu'avec l'AGRICULTURE : tant
 * qu'on n'a pas bâti de ferme, la population ne monte que par le clic et la bande (autoclicker).
 * Le premier champ est donc un vrai cap : « la population croît désormais d'elle-même ».
 */
export function reproductionUnlocked(state: GameState): boolean {
  return (state.owned['farmland'] ?? 0) > 0;
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
    if (state.purchased[up.id]) for (const e of up.effects) applyEffect(mods, e, 1);
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
  capacity: Decimal;
  foodProduction: Decimal;
  foodConsumption: Decimal;
  food: Decimal; // net Vivres/s (peut être négatif)
  resources: Decimal; // Matière/s
  knowledge: Decimal;
  energy: Decimal;
  population: Decimal; // croissance nette/s
}

export function computeFlows(state: GameState): Flows {
  const mods = collectModifiers(state);
  const pop = state.resources.population.amount;

  // Allocation de la population entre cueillette et labeur.
  const total = Math.max(1, state.allocation.forage + state.allocation.labor);
  const fShare = state.allocation.forage / total;
  const lShare = state.allocation.labor / total;

  const gen = generatorProduction(state);

  // Poussée active du clic (pilotage), sur le goulot choisi.
  const driveBoost = new Decimal(1).add(state.drive);
  const growthBoost = state.driveTarget === 'growth' ? driveBoost : new Decimal(1);
  const researchBoost = state.driveTarget === 'research' ? driveBoost : new Decimal(1);
  const buildBoost = state.driveTarget === 'construction' ? driveBoost : new Decimal(1);

  // Vivres = MONNAIE, revenu non plafonné qui croît avec la population (pas de consommation/famine).
  const foodProduction = FOOD_BASE.add(
    pop.mul(fShare).mul(FORAGE_RATE).mul(mods.productionMult.food),
  ).add(gen.food);
  const netFood = foodProduction; // pas de consommation : revenu = production

  // Capacité (limite de population) = base + apport des fermes (× énergie plus tard). Sans plafond
  // dur : les fermes la relèvent indéfiniment. JAMAIS affichée (cf. capacity-never-displayed).
  const energyFactor = state.resources.energy.amount.div(CAPACITY_ENERGY_SCALE).add(1);
  const capacity = BASE_POP_CAP.add(mods.foodCeilingBonus).mul(energyFactor).mul(mods.capacityFactor);

  const matiere = pop
    .mul(lShare)
    .mul(LABOR_RATE)
    .add(gen.resources)
    .mul(mods.productionMult.resources)
    .mul(buildBoost);
  const knowledge = pop
    .mul(KNOWLEDGE_PER_CAPITA)
    .add(gen.knowledge)
    .mul(mods.productionMult.knowledge)
    .mul(researchBoost);
  const energy = gen.energy.mul(mods.productionMult.energy);

  // Croissance (le clamp à la capacité se fait dans `step`) :
  // - additif (clic via store + bande) : amène des Humains directement ;
  // - logistique (reproduction auto) : SEULEMENT après l'agriculture (cf. reproductionUnlocked).
  const additive = gen.population.mul(mods.productionMult.population);
  const effectiveRate = growthBoost.mul(BASE_GROWTH_RATE).toNumber();
  let logistic = reproductionUnlocked(state)
    ? logisticDelta(pop, capacity, effectiveRate, 1)
    : new Decimal(0);
  if (logistic.lt(0)) logistic = new Decimal(0); // pop > capacité → plateau, pas de mort
  const population = additive.add(logistic);

  return {
    mods,
    capacity,
    foodProduction,
    foodConsumption: new Decimal(0), // plus de consommation (Vivres = monnaie) ; gardé pour l'API
    food: netFood,
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

  // Aucun mur invisible : la population ne fait que monter (clic + bande = additif inconditionnel ;
  // la reproduction logistique plafonne d'elle-même à la capacité, sans jamais bloquer le reste).
  const next: GameState = {
    ...state,
    resources: {
      population: { amount: addStock(state.resources.population.amount, f.population) },
      food: { amount: addStock(state.resources.food.amount, f.food) },
      resources: { amount: addStock(state.resources.resources.amount, f.resources) },
      knowledge: { amount: addStock(state.resources.knowledge.amount, f.knowledge) },
      energy: { amount: addStock(state.resources.energy.amount, f.energy) },
    },
    capacity: f.capacity,
    drive: state.drive.mul(Math.pow(DRIVE_DECAY_PER_S, dt)),
  };

  next.tier = computeTier(next, f.mods.unlockedTierLevels);
  next.discovered = computeDiscovered(next);
  return next;
}

import Decimal from 'break_infinity.js';
import type { ClickRegime, Effect, GameState, ResourceId } from './types';
import { isUnlocked, logisticDelta } from './formulas';
import { computeTier } from './tiers';
import { GENERATORS } from '../data/generators.data';
import { TECHS } from '../data/techs.data';
import { UPGRADES } from '../data/upgrades.data';
import { minigameEffects } from '../minigames/effects';
import { POP_NEOLITHIC, POWER_START } from '../data/constants';

// engine.ts applique UN tick à pas fixe : énergie → capacité → pop (ADDITIF d'amorçage + logistique)
// → savoir → unlocks. Cf. architecture §3 et 05_mechanics §1. Tout est en Decimal ; aucune formule
// ici n'est dupliquée dans l'UI.

// --- Constantes d'équilibrage (DRAFT, à caler en playtest) ---
const BASE_CAPACITY = POP_NEOLITHIC; // plafond de capacité de l'aube (avant énergie/techs)
const RESOURCES_PER_CAPITA = new Decimal('0.2'); // biens produits par habitant/s (monnaie de base)
const KNOWLEDGE_PER_CAPITA = new Decimal('1e-4'); // fraction de pop qui "fait de la science"/s
const BASE_GROWTH_RATE = 0.05; // r de la logistique (par seconde)
const DRIVE_DECAY_PER_S = 0.5; // la poussée du clic retombe (×0.5 par seconde)

/** Seuil de bascule amorçage → pilotage (cf. 05_mechanics §1.3). Draft. */
export const BOOTSTRAP_DONE = new Decimal(500);

/** Régime du clic, dérivé de l'état (monotone : une fois en 'drive', on y reste de fait). */
export function clickRegime(state: GameState): ClickRegime {
  return state.resources.population.amount.gte(BOOTSTRAP_DONE) ? 'drive' : 'bootstrap';
}

/**
 * La reproduction logistique (croissance auto) ne s'active qu'avec une 1re infrastructure : un
 * surplus alimentaire (ferme) ou l'agriculture. Avant ça, la pop ne croît QUE par le clic et
 * l'autoclicker (terme additif). Choix de design : « pas de repro avant infra ».
 */
export function reproductionUnlocked(state: GameState): boolean {
  return (state.owned['farmland'] ?? 0) > 0 || state.purchased['agriculture'] === true;
}

/** Multiplicateurs agrégés issus de tous les effets actifs (techs/upgrades 1×, générateurs ^owned). */
export interface ActiveModifiers {
  capacityFactor: Decimal;
  productionMult: Record<ResourceId, Decimal>;
  clickMult: Decimal;
  unlockedTierLevels: Set<number>;
}

function applyEffect(mods: ActiveModifiers, e: Effect, times: number): void {
  switch (e.kind) {
    case 'raiseCapacity':
      mods.capacityFactor = mods.capacityFactor.mul(Decimal.pow(e.factor, times));
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
      // Géré par le déblocage/UI ; pas d'effet numérique sur le tick.
      break;
  }
}

export function collectModifiers(state: GameState): ActiveModifiers {
  const mods: ActiveModifiers = {
    capacityFactor: new Decimal(1),
    productionMult: {
      population: new Decimal(1),
      resources: new Decimal(1),
      energy: new Decimal(1),
      knowledge: new Decimal(1),
    },
    clickMult: new Decimal(1),
    unlockedTierLevels: new Set<number>(),
  };

  for (const tech of TECHS) {
    if (state.purchased[tech.id]) {
      for (const e of tech.effects) applyEffect(mods, e, 1);
    }
  }
  for (const up of UPGRADES) {
    if (state.purchased[up.id]) {
      for (const e of up.effects) applyEffect(mods, e, 1);
    }
  }
  for (const gen of GENERATORS) {
    const owned = state.owned[gen.id] ?? 0;
    if (owned > 0 && gen.effects) {
      for (const e of gen.effects) applyEffect(mods, e, owned);
    }
  }
  // Contribution du mini-jeu actif (ex. mix énergétique au Tier I), via effets déclaratifs.
  for (const e of minigameEffects(state)) applyEffect(mods, e, 1);
  return mods;
}

/** Capacité de charge courante : plancher · énergie · effets (techs agricoles, etc.). */
export function computeCapacity(state: GameState, mods: ActiveModifiers): Decimal {
  // L'énergie relève le plafond. Formule DRAFT : factor = 1 + énergie/POWER_START.
  const energyFactor = state.resources.energy.amount.div(POWER_START).add(1);
  return BASE_CAPACITY.mul(energyFactor).mul(mods.capacityFactor);
}

/** Production brute par seconde de chaque ressource, à partir des générateurs possédés. */
function baseProduction(state: GameState): Record<ResourceId, Decimal> {
  const prod: Record<ResourceId, Decimal> = {
    population: new Decimal(0),
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
  // Apports de base de la population : biens (monnaie) et savoir.
  const pop = state.resources.population.amount;
  prod.resources = prod.resources.add(pop.mul(RESOURCES_PER_CAPITA));
  prod.knowledge = prod.knowledge.add(pop.mul(KNOWLEDGE_PER_CAPITA));
  return prod;
}

/** Condition d'apparition (révélation) d'un élément ; défaut = sa condition d'achat. */
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

/** Met à jour la carte des éléments RÉVÉLÉS (monotone : un révélé ne se re-cache jamais). */
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

/**
 * Avance l'état d'un pas fixe `dt` (secondes). Retourne un NOUVEL objet state
 * (références fraîches pour que les sélecteurs React se déclenchent).
 */
export function step(state: GameState, dt: number): GameState {
  const mods = collectModifiers(state);

  // 1) Capacité (dépend de l'énergie courante).
  const capacity = computeCapacity(state, mods);

  // 2) Poussée active du clic (régime pilotage), appliquée au goulot choisi.
  const driveBoost = new Decimal(1).add(state.drive);
  const growthBoost = state.driveTarget === 'growth' ? driveBoost : new Decimal(1);
  const researchBoost = state.driveTarget === 'research' ? driveBoost : new Decimal(1);
  const buildBoost = state.driveTarget === 'construction' ? driveBoost : new Decimal(1);

  // 3) Production des monnaies (ressources, savoir) et de l'énergie. Multiplicateurs inclus.
  const prod = baseProduction(state);
  const resourcesGain = prod.resources
    .mul(mods.productionMult.resources)
    .mul(buildBoost)
    .mul(dt);
  const knowledgeGain = prod.knowledge
    .mul(mods.productionMult.knowledge)
    .mul(researchBoost)
    .mul(dt);
  const energyGain = prod.energy.mul(mods.productionMult.energy).mul(dt);

  const nextResources = state.resources.resources.amount.add(resourcesGain);
  const nextKnowledge = state.resources.knowledge.amount.add(knowledgeGain);
  const nextEnergy = state.resources.energy.amount.add(energyGain);

  // 4) Population : terme ADDITIF d'amorçage `A` (autoclickers + apport généré) + logistique.
  //    A rend dP/dt > 0 même quand P = 0 (cf. 05_mechanics §1.2). Le clic d'amorçage ajoute
  //    sa pop directement dans le store ; ici A = production de population des générateurs.
  const pop = state.resources.population.amount;
  const additive = prod.population.mul(mods.productionMult.population).mul(dt); // A · dt (clic + autoclicker)
  const effectiveRate = growthBoost.mul(BASE_GROWTH_RATE).toNumber();
  // La repro logistique ne contribue qu'une fois l'infrastructure débloquée (cf. ci-dessus).
  const logistic = reproductionUnlocked(state)
    ? logisticDelta(pop, capacity, effectiveRate, dt)
    : new Decimal(0);
  let nextPop = pop.add(additive).add(logistic);
  if (nextPop.lt(0)) nextPop = new Decimal(0);

  // 5) Décroissance de la poussée du clic.
  const nextDrive = state.drive.mul(Math.pow(DRIVE_DECAY_PER_S, dt));

  const next: GameState = {
    ...state,
    resources: {
      population: { amount: nextPop },
      resources: { amount: nextResources },
      knowledge: { amount: nextKnowledge },
      energy: { amount: nextEnergy },
    },
    capacity,
    drive: nextDrive,
  };

  // 6) Tier Kardashev + révélation progressive.
  next.tier = computeTier(next, mods.unlockedTierLevels);
  next.discovered = computeDiscovered(next);

  return next;
}

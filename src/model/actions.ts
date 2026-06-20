import Decimal from 'break_infinity.js';
import type { GameState, ResourceId } from './types';
import { canAfford, generatorBatchCost, isUnlocked } from './formulas';
import { clickRegime, collectModifiers } from './engine';
import { generatorById } from '../data/generators.data';
import { techById } from '../data/techs.data';
import { upgradeById } from '../data/upgrades.data';
import { POP_START } from '../data/constants';
import { now } from '../core/time';

// Réducteurs PURS du jeu : (state) → state. Partagés par le store (UI) ET le banc de simulation
// (sim/) → une seule source de vérité, zéro divergence de règles. Un no-op renvoie le MÊME objet.

const DRIVE_CAP = new Decimal(10); // borne la poussée du clic (driveBoost = 1 + drive)

export function initialState(): GameState {
  return {
    resources: {
      population: { amount: POP_START }, // départ à 0 : le clic crée les premiers Humains
      food: { amount: new Decimal(100) }, // tampon de Vivres au départ (boucle de subsistance)
      resources: { amount: new Decimal(0) },
      knowledge: { amount: new Decimal(0) },
      energy: { amount: new Decimal(0) },
    },
    capacity: new Decimal(0), // dérivée chaque tick (jamais affichée)
    tier: 0,
    owned: {},
    purchased: {},
    clickPower: new Decimal(1),
    drive: new Decimal(0),
    driveTarget: 'growth',
    allocation: { forage: 1, labor: 0 }, // au début tout le monde cueille
    autoclickers: {},
    buyQuantity: 1,
    discovered: {},
    minigame: undefined,
    lastSaved: now(),
    settings: { notation: 'full', theme: 'instrument', transhumanLabels: false },
  };
}

function deduct(
  resources: GameState['resources'],
  cost: Partial<Record<ResourceId, Decimal>>,
): GameState['resources'] {
  const next = { ...resources };
  for (const [res, amount] of Object.entries(cost) as [ResourceId, Decimal][]) {
    next[res] = { amount: resources[res].amount.sub(amount) };
  }
  return next;
}

/** Clic à deux régimes : amorçage → crée de la pop ; pilotage → poussée allouée au goulot. */
export function applyClick(state: GameState): GameState {
  const mods = collectModifiers(state);
  const power = state.clickPower.mul(mods.clickMult);
  if (clickRegime(state) === 'bootstrap') {
    // Le clic crée TOUJOURS des Humains (l'accroche ne doit jamais rester sans réponse).
    const next = state.resources.population.amount.add(power);
    return { ...state, resources: { ...state.resources, population: { amount: next } } };
  }
  return { ...state, drive: Decimal.min(state.drive.add(power), DRIVE_CAP) };
}

/** Achète un lot `buyQuantity` d'un générateur (atomique). No-op si non débloqué / non payable. */
export function applyBuyGenerator(state: GameState, id: string): GameState {
  const def = generatorById(id);
  if (!def || !isUnlocked(state, def.unlock)) return state;
  const owned = state.owned[id] ?? 0;
  const n = state.buyQuantity;
  const cost = generatorBatchCost(def, owned, n);
  if (!canAfford(state, cost)) return state;
  return {
    ...state,
    resources: deduct(state.resources, cost),
    owned: { ...state.owned, [id]: owned + n },
  };
}

export function applyBuyTech(state: GameState, id: string): GameState {
  const def = techById(id);
  if (!def || state.purchased[id]) return state;
  const requiresOk = (def.requires ?? []).every((r) => state.purchased[r]);
  if (!requiresOk || !canAfford(state, def.cost)) return state;
  return {
    ...state,
    resources: deduct(state.resources, def.cost),
    purchased: { ...state.purchased, [id]: true },
  };
}

export function applyBuyUpgrade(state: GameState, id: string): GameState {
  const def = upgradeById(id);
  if (!def || state.purchased[id] || !isUnlocked(state, def.unlock)) return state;
  if (!canAfford(state, def.cost)) return state;
  return {
    ...state,
    resources: deduct(state.resources, def.cost),
    purchased: { ...state.purchased, [id]: true },
  };
}

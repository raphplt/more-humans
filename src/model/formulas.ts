import Decimal from 'break_infinity.js';
import type {
  Effect,
  GameState,
  GeneratorDef,
  ResourceId,
  UnlockCondition,
  UpgradeDef,
} from './types';

// Toutes les formules du jeu sont centralisées ici. Cf. 01_ARCHITECTURE §2 règle 5.
// Aucune formule en dur dans l'UI ou les fichiers de données.

/**
 * Facteur de coût d'un LOT de `n` achats à partir de `owned` déjà possédés (somme géométrique) —
 * ne JAMAIS boucler n achats. Cf. architecture §8 / 05_mechanics §5.1 :
 *   facteur(owned, n) = g^owned · (g^n − 1) / (g − 1)   (g = costGrowth ; g=1 → n)
 */
function batchFactor(growth: number, owned: number, n: number): Decimal {
  return growth === 1
    ? new Decimal(n)
    : Decimal.pow(growth, owned).mul(Decimal.sub(Decimal.pow(growth, n), 1)).div(growth - 1);
}

function scaleCost(
  base: Partial<Record<ResourceId, Decimal>>,
  factor: Decimal,
): Partial<Record<ResourceId, Decimal>> {
  const out: Partial<Record<ResourceId, Decimal>> = {};
  for (const [res, amt] of Object.entries(base) as [ResourceId, Decimal][]) {
    out[res] = amt.mul(factor);
  }
  return out;
}

/** Coût d'un lot de `n` générateurs à partir de `owned` possédés. */
export function generatorBatchCost(
  def: GeneratorDef,
  owned: number,
  n: number,
): Partial<Record<ResourceId, Decimal>> {
  return scaleCost(def.baseCost, batchFactor(def.costGrowth, owned, n));
}

/** Coût d'un achat unitaire (raccourci de generatorBatchCost avec n = 1). */
export function generatorCost(
  def: GeneratorDef,
  owned: number,
): Partial<Record<ResourceId, Decimal>> {
  return generatorBatchCost(def, owned, 1);
}

/** Coût d'un lot de `n` niveaux d'une amélioration à partir du niveau courant. */
export function upgradeBatchCost(
  def: UpgradeDef,
  level: number,
  n: number,
): Partial<Record<ResourceId, Decimal>> {
  return scaleCost(def.cost, batchFactor(def.costGrowth, level, n));
}

/** Le joueur peut-il payer ce coût ? */
export function canAfford(
  state: GameState,
  cost: Partial<Record<ResourceId, Decimal>>,
): boolean {
  for (const [res, amount] of Object.entries(cost) as [ResourceId, Decimal][]) {
    if (state.resources[res].amount.lt(amount)) return false;
  }
  return true;
}

/**
 * DELTA logistique de population sur un pas `dt` (secondes) : r · P · (1 − P/Capacity) · dt.
 * Cf. game-design §3.3. Nul quand P = 0 → c'est pourquoi le moteur ajoute un terme additif
 * d'amorçage `A` par-dessus (cf. 05_mechanics §1.2). Composer : ΔP = (A + cette valeur).
 */
export function logisticDelta(
  pop: Decimal,
  capacity: Decimal,
  rate: number,
  dt: number,
): Decimal {
  if (capacity.lte(0)) return new Decimal(0);
  const ratio = pop.div(capacity); // P/Capacity
  return pop.mul(rate * dt).mul(Decimal.sub(1, ratio));
}

/** Multiplicateur agrégé d'un certain type d'effet, à partir des effets actifs. */
export function aggregateEffectFactor(
  effects: Effect[],
  predicate: (e: Effect) => number | null,
): Decimal {
  let factor = new Decimal(1);
  for (const e of effects) {
    const f = predicate(e);
    if (f !== null) factor = factor.mul(f);
  }
  return factor;
}

/** Une condition de déblocage est-elle remplie dans cet état ? */
export function isUnlocked(state: GameState, cond?: UnlockCondition): boolean {
  if (!cond) return true;
  switch (cond.kind) {
    case 'resource':
      return state.resources[cond.resource].amount.gte(cond.atLeast);
    case 'tier':
      return state.tier >= cond.atLeast;
    case 'tech':
      return state.purchased[cond.id] === true;
    case 'all':
      return cond.of.every((c) => isUnlocked(state, c));
  }
}

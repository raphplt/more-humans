import Decimal from 'break_infinity.js';
import type { ResourceId } from '../model/types';
import { kardashevType } from '../data/constants';

// Libellés FR courts des ressources (pour les coûts/affichages).
const RES_LABEL: Record<ResourceId, string> = {
  population: 'hab.',
  food: 'Vivres',
  resources: 'Matière', // id interne 'resources' ; libellé joueur « Matière » (cf. naming-and-upgrades)
  knowledge: 'Savoir',
  energy: 'W',
};

export function resourceLabel(id: ResourceId): string {
  return RES_LABEL[id];
}

// Formatage unité-conscient des Decimal — CHIFFRES PLEINS, JAMAIS d'exposant.
// Cf. architecture §6 / 05_mechanics §4. Interdit : 1.23e16, 10⁷, notation scientifique/nommée.

const THIN = ' '; // espace fine insécable (séparateur de milliers)

/** Regroupe une chaîne de chiffres par milliers avec une espace fine. */
function groupThousands(digits: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += THIN;
    out += digits[i];
  }
  return out;
}

/**
 * Reconstruit la chaîne décimale ENTIÈRE d'un Decimal sans repasser par `Number`
 * (qui ment au-delà de ~1e15). Les chiffres de poids faible au-delà de la précision
 * disponible sont du bruit : on les rend comme `0` (l'ordre de grandeur plein suffit).
 */
function fullInteger(d: Decimal): string {
  if (d.lt(0)) return '-' + fullInteger(d.neg());
  if (d.lt(1)) return '0';
  const exp = d.exponent; // entier ; valeur ≈ mantissa · 10^exp
  // 15 chiffres significatifs depuis la mantisse (1 avant la virgule + 14 après).
  const sig = d.mantissa.toFixed(14).replace('.', '');
  let digits: string;
  const zerosAfter = exp - 14;
  if (zerosAfter >= 0) {
    digits = sig + '0'.repeat(zerosAfter);
  } else {
    digits = sig.slice(0, exp + 1) || '0';
  }
  return digits;
}

/**
 * Format de jeu par défaut : chiffres pleins ENTIERS, groupés par milliers.
 * ZÉRO décimale à l'écran (règle de design) — on plancher systématiquement.
 */
export function formatFull(d: Decimal): string {
  if (d.abs().lt(1000)) return Math.floor(d.toNumber()).toString();
  return groupThousands(fullInteger(d));
}

/** Alias explicite pour les grandeurs entières (population, etc.). */
export function formatInt(d: Decimal): string {
  return formatFull(d);
}

/** Bonus en pourcentage ENTIER (jamais de virgule), ex. factor 1.33 → "+33 %". */
export function formatBonusPct(factor: number): string {
  return `+${Math.round((factor - 1) * 100)} %`;
}

/**
 * Type de Kardashev affichable, ex. "Type 0.73". SEULE valeur à décimales tolérée : c'est un index
 * scientifique (échelle de Sagan), pas un montant de jeu — le repère-signature de progression.
 * Clampé à 0 (la formule devient négative sous 10⁶ W : ne jamais afficher "Type -0.53").
 */
export function kardashevLabel(power: Decimal): string {
  return `Type ${Math.max(0, kardashevType(power)).toFixed(2)}`;
}

/** Énergie en W (chiffres pleins, sans décimale). */
export function formatWatts(power: Decimal): string {
  return `${formatInt(power)} W`;
}

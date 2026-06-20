import Decimal from 'break_infinity.js';
import type { ResourceId } from '../model/types';
import { kardashevType } from '../data/constants';

// Libellés FR courts des ressources (pour les coûts/affichages).
const RES_LABEL: Record<ResourceId, string> = {
  population: 'hab.',
  resources: 'ressources',
  knowledge: 'savoir',
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
 * Format de jeu par défaut : chiffres pleins.
 * - sous 1000 : on tolère jusqu'à 2 décimales (le tout début, savoir/énergie fractionnaires) ;
 * - au-delà : entier complet groupé par milliers.
 */
export function formatFull(d: Decimal): string {
  if (d.abs().lt(1000)) {
    const n = d.toNumber();
    return Number.isInteger(n)
      ? n.toString()
      : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  }
  return groupThousands(fullInteger(d));
}

/** Grandeur ENTIÈRE (population : des gens — jamais de virgule). Plancher à l'entier. */
export function formatInt(d: Decimal): string {
  return formatFull(d.floor());
}

/** Multiplicateur (petit) : ×1.50. Jamais d'exposant ici non plus. */
export function formatMult(d: Decimal): string {
  return d.toNumber().toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

/** Type de Kardashev affichable, ex. "Type 0.73". Repère de progression (Sagan). */
export function kardashevLabel(power: Decimal): string {
  return `Type ${kardashevType(power).toFixed(2)}`;
}

/** Énergie en W + tier Kardashev fractionnaire. */
export function formatWatts(power: Decimal): string {
  return `${formatFull(power)} W — ${kardashevLabel(power)}`;
}

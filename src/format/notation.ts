import Decimal from 'break_infinity.js';
import type { ResourceId } from '../model/types';
import { kardashevType } from '../data/constants';

const RES_LABEL: Record<ResourceId, string> = {
  population: 'hab.',
  food: 'Vivres',
  resources: 'Matière',
  knowledge: 'Savoir',
  energy: 'W',
};

export function resourceLabel(id: ResourceId): string {
  return RES_LABEL[id];
}

// Notation chiffres pleins, JAMAIS d'exposant (cf. architecture §6 / 05_mechanics §4, règle 10).
// Sous un million : chiffres groupés par milliers. Au-delà : mots pleins de l'ÉCHELLE LONGUE
// française (million 1e6, milliard 1e9, billion 1e12, billiard 1e15, trillion 1e18…) — lisible d'un
// coup d'œil et conforme au repli « mots français pleins » autorisé par la règle.

const THIN = ' ';

const LONG_SCALE = [
  'million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard',
  'quadrillion', 'quadrilliard', 'quintillion', 'quintilliard', 'sextillion', 'sextilliard',
  'septillion', 'septilliard', 'octillion', 'octilliard', 'nonillion', 'nonilliard',
  'décillion', 'décilliard', 'undécillion', 'undécilliard', 'duodécillion', 'duodécilliard',
];

function groupThousands(digits: string): string {
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += THIN;
    out += digits[i];
  }
  return out;
}

// Chaîne décimale ENTIÈRE sans repasser par Number (qui ment au-delà de ~1e15) — repli extrême.
function fullInteger(d: Decimal): string {
  if (d.lt(1)) return '0';
  const exp = d.exponent;
  const sig = d.mantissa.toFixed(14).replace('.', '');
  const zerosAfter = exp - 14;
  return zerosAfter >= 0 ? sig + '0'.repeat(zerosAfter) : sig.slice(0, exp + 1) || '0';
}

// Nombre + nom d'échelle longue (1-3 chiffres significatifs devant l'unité).
function named(d: Decimal): string {
  const exp = d.exponent;
  const unitExp = Math.floor(exp / 3) * 3;
  const k = unitExp / 3 - 2;
  if (k < 0 || k >= LONG_SCALE.length) return groupThousands(fullInteger(d));
  const leading = d.mantissa * Math.pow(10, exp - unitExp);
  const rounded = leading < 100 ? Math.round(leading * 10) / 10 : Math.round(leading);
  const numStr = (Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)).replace('.', ',');
  return `${numStr} ${LONG_SCALE[k]}${rounded >= 2 ? 's' : ''}`;
}

/** Format de jeu : entiers, ZÉRO décimale sous un million, mots pleins au-delà. */
export function formatFull(d: Decimal): string {
  if (d.lt(0)) return '-' + formatFull(d.neg());
  if (d.lt(1000)) return Math.floor(d.toNumber()).toString();
  if (d.lt(1000000)) return groupThousands(fullInteger(d));
  return named(d);
}

export function formatInt(d: Decimal): string {
  return formatFull(d);
}

export function formatBonusPct(factor: number): string {
  return `+${Math.round((factor - 1) * 100)} %`;
}

/**
 * Type de Kardashev affichable, ex. "Type 0.73". SEULE valeur à décimales tolérée : index
 * scientifique (échelle de Sagan), pas un montant de jeu. Clampé à 0 (négatif sous 10⁶ W).
 */
export function kardashevLabel(power: Decimal): string {
  return `Type ${Math.max(0, kardashevType(power)).toFixed(2)}`;
}

export function formatWatts(power: Decimal): string {
  return `${formatInt(power)} W`;
}

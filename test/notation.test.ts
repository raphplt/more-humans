import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import {
  formatBonusPct,
  formatFull,
  formatWatts,
  kardashevLabel,
} from '../src/format/notation';

const stripped = (s: string) => s.replace(/\s/g, '');

describe('formatFull — chiffres pleins, jamais d’exposant', () => {
  it('petits entiers tels quels', () => {
    expect(formatFull(new Decimal(0))).toBe('0');
    expect(formatFull(new Decimal(999))).toBe('999');
  });

  it('groupe par milliers', () => {
    expect(stripped(formatFull(new Decimal(1000)))).toBe('1000');
    expect(stripped(formatFull(new Decimal(1234567)))).toBe('1234567');
  });

  it('reconstruit l’ordre de grandeur plein sans Number', () => {
    expect(stripped(formatFull(new Decimal('1e7')))).toBe('10000000');
    expect(stripped(formatFull(new Decimal('1e21')))).toBe('1' + '0'.repeat(21));
  });

  it('AUCUNE notation scientifique à toutes les échelles', () => {
    for (const mag of ['1e7', '1e15', '1e21', '3.8e26', '1e100']) {
      const out = formatFull(new Decimal(mag));
      expect(/[eE^]/.test(out)).toBe(false);
      expect(/^[\d\s]+$/.test(out)).toBe(true);
    }
  });
});

describe('formatBonusPct', () => {
  it('pourcentage entier signé', () => {
    expect(formatBonusPct(1.33)).toBe('+33 %');
    expect(formatBonusPct(2)).toBe('+100 %');
  });
});

describe('kardashevLabel / formatWatts', () => {
  it('index de Sagan clampé à 0', () => {
    expect(kardashevLabel(new Decimal('1e16'))).toBe('Type 1.00');
    expect(kardashevLabel(new Decimal('1e6'))).toBe('Type 0.00');
    expect(kardashevLabel(new Decimal(1))).toBe('Type 0.00');
  });

  it('watts en chiffres pleins suffixés', () => {
    expect(formatWatts(new Decimal(1000)).endsWith(' W')).toBe(true);
    expect(/[eE^]/.test(formatWatts(new Decimal('1e16')))).toBe(false);
  });
});

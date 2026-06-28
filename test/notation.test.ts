import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import {
  formatBonusPct,
  formatFull,
  formatWatts,
  kardashevLabel,
} from '../src/format/notation';

const stripped = (s: string) => s.replace(/\s/g, '');
const noScientific = (s: string) => !/\d[eE][+-]?\d/.test(s) && !/[×^]/.test(s);

describe('formatFull — mots pleins, jamais d’exposant', () => {
  it('petits entiers tels quels', () => {
    expect(formatFull(new Decimal(0))).toBe('0');
    expect(formatFull(new Decimal(999))).toBe('999');
  });

  it('groupe par milliers sous un million', () => {
    expect(stripped(formatFull(new Decimal(1000)))).toBe('1000');
    expect(stripped(formatFull(new Decimal(123456)))).toBe('123456');
  });

  it('mots d’échelle longue au-delà du million', () => {
    expect(formatFull(new Decimal('1e7'))).toBe('10 millions');
    expect(formatFull(new Decimal('1e9'))).toBe('1 milliard');
    expect(formatFull(new Decimal('1e21'))).toBe('1 trilliard');
    expect(formatFull(new Decimal('3.8e26'))).toBe('380 quadrillions');
  });

  it('pluriel correct (s si ≥ 2)', () => {
    expect(formatFull(new Decimal('1e6'))).toBe('1 million');
    expect(formatFull(new Decimal('2e6'))).toBe('2 millions');
    expect(formatFull(new Decimal('1.5e9'))).toBe('1,5 milliard');
  });

  it('jamais de notation scientifique à toutes les échelles', () => {
    for (const mag of ['1e7', '1e15', '1e21', '3.8e26', '1e100']) {
      expect(noScientific(formatFull(new Decimal(mag)))).toBe(true);
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

  it('watts en mots pleins suffixés', () => {
    expect(formatWatts(new Decimal(1000)).endsWith(' W')).toBe(true);
    expect(noScientific(formatWatts(new Decimal('1e16')))).toBe(true);
  });
});

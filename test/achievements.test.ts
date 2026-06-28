import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import { ACHIEVEMENTS, newlyUnlocked } from '../src/data/achievements.data';
import { initialState } from '../src/model/actions';

describe('succès', () => {
  it('détecte les nouveaux succès franchis', () => {
    const s = initialState();
    expect(newlyUnlocked(s, {})).toEqual([]); // pop 0 → rien
    s.resources.population.amount = new Decimal(25);
    expect(newlyUnlocked(s, {})).toContain('first_humans');
  });

  it('ne re-déclenche pas un succès déjà débloqué', () => {
    const s = initialState();
    s.resources.population.amount = new Decimal(25);
    expect(newlyUnlocked(s, { first_humans: true })).not.toContain('first_humans');
  });

  it('ids uniques', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

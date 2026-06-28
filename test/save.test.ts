import { describe, it, expect } from 'vitest';
import Decimal from 'break_infinity.js';
import { deserialize, exportSave, importSave, serialize } from '../src/state/save';
import { migrate, SAVE_VERSION } from '../src/state/schema';
import { initialState } from '../src/model/actions';

describe('serialize / deserialize', () => {
  it('round-trip : Decimal préservés en string puis revivifiés', () => {
    const s = initialState();
    s.owned = { woodfire: 3 };
    s.tier = 1;
    s.resources.knowledge.amount = new Decimal('1234567890123456789');
    const r = deserialize(serialize(s));
    expect(r.resources.knowledge.amount.toString()).toBe(s.resources.knowledge.amount.toString());
    expect(r.tier).toBe(1);
    expect(r.owned.woodfire).toBe(3);
    expect(r.resources.energy.amount instanceof Decimal).toBe(true);
  });
});

describe('export / import base64', () => {
  it('round-trip portable', () => {
    const s = initialState();
    s.resources.population.amount = new Decimal('987654321');
    const r = importSave(exportSave(s));
    expect(r).not.toBeNull();
    expect(r!.resources.population.amount.toString()).toBe('987654321');
  });

  it('chaîne invalide → null (pas d’exception)', () => {
    expect(importSave('@@@ pas du base64 @@@')).toBeNull();
  });
});

describe('migrations de save', () => {
  it('une save v1 minimale est portée à la version courante', () => {
    const v1 = {
      version: 1,
      resources: { population: '10', food: '50', knowledge: '5', energy: '0' },
      capacity: '25',
      tier: 0,
      owned: {},
      purchased: {},
      clickPower: '1',
      drive: '0',
      driveTarget: 'growth',
      lastSaved: 123,
      settings: {},
    };
    const m = migrate(v1) as Record<string, unknown>;
    expect(m.version).toBe(SAVE_VERSION);
    expect((m.resources as Record<string, string>).resources).toBe('0');
    expect((m.resources as Record<string, string>).food).toBe('50');
    expect((m.settings as Record<string, unknown>).notation).toBe('full');
    expect(m.allocation).toBeDefined();
    expect(m.upgradeLevels).toBeDefined();
    expect(m.achievements).toBeDefined();
    expect(m.playtimeMs).toBe(0);
    expect(() => deserialize(m as never)).not.toThrow();
  });
});

import Decimal from 'break_infinity.js';
import type { BuyQuantity, DriveTarget, GameState } from '../model/types';
import { SAVE_VERSION, migrate, type SerializedSave } from './schema';
import { now } from '../core/time';

// Sérialisation / autosave / export-import. Cf. architecture §5.
// Discipline : Decimal → string (.toString()) ; revivifié via new Decimal(str).

export const STORAGE_KEY = 'more-humans:save';

export function serialize(state: GameState): SerializedSave {
  return {
    version: SAVE_VERSION,
    resources: {
      population: state.resources.population.amount.toString(),
      resources: state.resources.resources.amount.toString(),
      knowledge: state.resources.knowledge.amount.toString(),
      energy: state.resources.energy.amount.toString(),
    },
    capacity: state.capacity.toString(),
    tier: state.tier,
    owned: state.owned,
    purchased: state.purchased,
    clickPower: state.clickPower.toString(),
    drive: state.drive.toString(),
    driveTarget: state.driveTarget,
    autoclickers: state.autoclickers,
    buyQuantity: state.buyQuantity,
    discovered: state.discovered,
    minigame: state.minigame,
    lastSaved: state.lastSaved,
    settings: state.settings,
  };
}

export function deserialize(raw: SerializedSave): GameState {
  return {
    resources: {
      population: { amount: new Decimal(raw.resources.population) },
      resources: { amount: new Decimal(raw.resources.resources) },
      knowledge: { amount: new Decimal(raw.resources.knowledge) },
      energy: { amount: new Decimal(raw.resources.energy) },
    },
    capacity: new Decimal(raw.capacity),
    tier: raw.tier,
    owned: raw.owned ?? {},
    purchased: raw.purchased ?? {},
    clickPower: new Decimal(raw.clickPower),
    drive: new Decimal(raw.drive),
    driveTarget: raw.driveTarget as DriveTarget,
    autoclickers: raw.autoclickers ?? {},
    buyQuantity: (raw.buyQuantity as BuyQuantity) ?? 1,
    discovered: raw.discovered ?? {},
    minigame: raw.minigame,
    lastSaved: raw.lastSaved,
    settings: raw.settings,
  };
}

export function saveGame(state: GameState): void {
  const payload = serialize({ ...state, lastSaved: now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadGame(): GameState | null {
  const text = localStorage.getItem(STORAGE_KEY);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const migrated = migrate(parsed) as unknown as SerializedSave;
    return deserialize(migrated);
  } catch {
    return null;
  }
}

// --- Export / import portable (string base64) ---

export function exportSave(state: GameState): string {
  const json = JSON.stringify(serialize(state));
  return btoa(unescape(encodeURIComponent(json)));
}

export function importSave(b64: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(b64.trim())));
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const migrated = migrate(parsed) as unknown as SerializedSave;
    return deserialize(migrated);
  } catch {
    return null;
  }
}

import type { ThemeName } from '../model/types';

// Version de save + migrations. Cf. architecture §5.
// Une save existante DOIT survivre aux updates : toute évolution de forme = +1 version + migration.

export const SAVE_VERSION = 3;

/** Forme sérialisée (les Decimal sont des strings). Volontairement permissive entre versions. */
export interface SerializedSave {
  version: number;
  resources: { population: string; resources: string; knowledge: string; energy: string };
  capacity: string;
  tier: number;
  owned: Record<string, number>;
  purchased: Record<string, boolean>;
  clickPower: string;
  drive: string;
  driveTarget: string;
  autoclickers: Record<string, number>;
  buyQuantity: number;
  discovered: Record<string, boolean>;
  minigame?: unknown;
  lastSaved: number;
  settings: { notation: 'full'; theme: ThemeName; transhumanLabels: boolean };
}

// Migrations indexées par version SOURCE : migrations[n] transforme une save v.n en v.(n+1).
type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, Migration> = {
  // v1 → v2 : ajout amorçage/automatisation, achat groupé, révélation, thèmes ; notation → 'full'.
  1: (raw) => {
    const settings = (raw.settings ?? {}) as Record<string, unknown>;
    return {
      ...raw,
      version: 2,
      autoclickers: raw.autoclickers ?? {},
      buyQuantity: raw.buyQuantity ?? 1,
      discovered: raw.discovered ?? {},
      minigame: raw.minigame,
      settings: {
        notation: 'full',
        theme: (settings.theme as ThemeName) ?? 'instrument',
        transhumanLabels: settings.transhumanLabels ?? false,
      },
    };
  },
  // v2 → v3 : nouvelle monnaie 'resources' (la population ne se dépense plus). Défaut 0.
  2: (raw) => {
    const res = (raw.resources ?? {}) as Record<string, unknown>;
    return {
      ...raw,
      version: 3,
      resources: { ...res, resources: (res.resources as string) ?? '0' },
    };
  },
};

/** Applique les migrations successives jusqu'à SAVE_VERSION. */
export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  let current = raw;
  let version = typeof raw.version === 'number' ? raw.version : 0;
  while (version < SAVE_VERSION && migrations[version]) {
    current = migrations[version](current);
    version = typeof current.version === 'number' ? current.version : version + 1;
  }
  current.version = SAVE_VERSION;
  return current;
}

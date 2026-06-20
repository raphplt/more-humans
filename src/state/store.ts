import Decimal from 'break_infinity.js';
import { create } from 'zustand';
import type { BuyQuantity, DriveTarget, GameState, ResourceId, ThemeName } from '../model/types';
import { canAfford, generatorBatchCost, isUnlocked } from '../model/formulas';
import { clickRegime, collectModifiers, step } from '../model/engine';
import { generatorById } from '../data/generators.data';
import { techById } from '../data/techs.data';
import { upgradeById } from '../data/upgrades.data';
import { POP_NEOLITHIC, POP_START } from '../data/constants';
import { now } from '../core/time';

// Store Zustand : source de vérité + actions. Cf. architecture §2.
// La game loop (core/loop) mute ce store via tick() ; React s'abonne à des slices.

const DRIVE_CAP = new Decimal(10); // borne la poussée du clic (driveBoost = 1 + drive)

export function initialState(): GameState {
  return {
    // Départ à 0 : le jeu démarre vide, le clic crée les premiers Humains (cf. 05_mechanics §1).
    resources: {
      population: { amount: POP_START },
      resources: { amount: new Decimal(0) },
      knowledge: { amount: new Decimal(0) },
      energy: { amount: new Decimal(0) },
    },
    capacity: POP_NEOLITHIC, // plafond initial (avant énergie/techs)
    tier: 0,
    owned: {},
    purchased: {},
    clickPower: new Decimal(1), // 1 Humain par clic en amorçage (draft)
    drive: new Decimal(0),
    driveTarget: 'growth',
    autoclickers: {},
    buyQuantity: 1,
    discovered: {},
    minigame: undefined,
    lastSaved: now(),
    settings: { notation: 'full', theme: 'instrument', transhumanLabels: false },
  };
}

function deduct(
  resources: GameState['resources'],
  cost: Partial<Record<ResourceId, Decimal>>,
): GameState['resources'] {
  const next = { ...resources };
  for (const [res, amount] of Object.entries(cost) as [ResourceId, Decimal][]) {
    next[res] = { amount: resources[res].amount.sub(amount) };
  }
  return next;
}

export interface GameStore extends GameState {
  tick: (dt: number) => void;
  click: () => void;
  setDriveTarget: (target: DriveTarget) => void;
  setBuyQuantity: (q: BuyQuantity) => void;
  setTheme: (theme: ThemeName) => void;
  setMinigame: (minigame: unknown) => void;
  buyGenerator: (id: string) => void;
  buyTech: (id: string) => void;
  buyUpgrade: (id: string) => void;
  hydrate: (state: GameState) => void;
  hardReset: () => void;
}

export const useStore = create<GameStore>((set) => ({
  ...initialState(),

  tick: (dt) => set((s) => step(s, dt)),

  // Clic à deux régimes (cf. 05_mechanics §1) : amorçage → crée de la pop ; pilotage → poussée.
  click: () =>
    set((s) => {
      const mods = collectModifiers(s);
      const power = s.clickPower.mul(mods.clickMult);
      if (clickRegime(s) === 'bootstrap') {
        return {
          resources: {
            ...s.resources,
            population: { amount: s.resources.population.amount.add(power) },
          },
        };
      }
      return { drive: Decimal.min(s.drive.add(power), DRIVE_CAP) };
    }),

  setDriveTarget: (target) => set({ driveTarget: target }),
  setBuyQuantity: (q) => set({ buyQuantity: q }),
  setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
  setMinigame: (minigame) => set({ minigame }),

  buyGenerator: (id) =>
    set((s) => {
      const def = generatorById(id);
      if (!def || !isUnlocked(s, def.unlock)) return {};
      const owned = s.owned[id] ?? 0;
      const n = s.buyQuantity;
      const cost = generatorBatchCost(def, owned, n); // lot atomique (somme géométrique)
      if (!canAfford(s, cost)) return {};
      return {
        resources: deduct(s.resources, cost),
        owned: { ...s.owned, [id]: owned + n },
      };
    }),

  buyTech: (id) =>
    set((s) => {
      const def = techById(id);
      if (!def || s.purchased[id]) return {};
      const requiresOk = (def.requires ?? []).every((r) => s.purchased[r]);
      if (!requiresOk) return {};
      if (!canAfford(s, def.cost)) return {};
      return {
        resources: deduct(s.resources, def.cost),
        purchased: { ...s.purchased, [id]: true },
      };
    }),

  buyUpgrade: (id) =>
    set((s) => {
      const def = upgradeById(id);
      if (!def || s.purchased[id] || !isUnlocked(s, def.unlock)) return {};
      if (!canAfford(s, def.cost)) return {};
      return {
        resources: deduct(s.resources, def.cost),
        purchased: { ...s.purchased, [id]: true },
      };
    }),

  hydrate: (state) => set({ ...state }),

  hardReset: () => set({ ...initialState() }),
}));

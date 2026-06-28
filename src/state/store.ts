import { create } from 'zustand';
import type { Allocation, BuyQuantity, DriveTarget, GameState, OfflineRecap } from '../model/types';
import { step } from '../model/engine';
import {
  applyBuyGenerator,
  applyBuyTech,
  applyBuyUpgrade,
  applyClick,
  initialState,
} from '../model/actions';
import { achievementById, newlyUnlocked } from '../data/achievements.data';

export interface Toast {
  key: number;
  text: string;
}

let toastKey = 0;

// Store Zustand : source de vérité + actions. Cf. architecture §2. Les RÈGLES vivent dans
// model/actions.ts (réducteurs purs), partagées avec le banc de simulation → zéro divergence.
// La game loop (core/loop) mute ce store via tick() ; React s'abonne à des slices.

export { initialState };

export interface GameStore extends GameState {
  offlineRecap: OfflineRecap | null; // hors GameState : non persisté
  setOfflineRecap: (recap: OfflineRecap | null) => void;
  toasts: Toast[]; // notifications éphémères (succès) — non persistées
  removeToast: (key: number) => void;
  tick: (dt: number) => void;
  click: () => void;
  setDriveTarget: (target: DriveTarget) => void;
  setBuyQuantity: (q: BuyQuantity) => void;
  setAllocation: (allocation: Allocation) => void;
  setMinigame: (minigame: unknown) => void;
  buyGenerator: (id: string) => void;
  buyTech: (id: string) => void;
  buyUpgrade: (id: string) => void;
  hydrate: (state: GameState) => void;
  hardReset: () => void;
}

export const useStore = create<GameStore>((set) => ({
  ...initialState(),
  offlineRecap: null,
  setOfflineRecap: (recap) => set({ offlineRecap: recap }),
  toasts: [],
  removeToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),

  tick: (dt) =>
    set((s) => {
      const next = step(s, dt);
      const playtimeMs = s.playtimeMs + dt * 1000;
      const fresh = newlyUnlocked(next, s.achievements);
      if (fresh.length === 0) return { ...next, playtimeMs };
      const achievements = { ...s.achievements };
      const toasts = [...s.toasts];
      for (const id of fresh) {
        achievements[id] = true;
        toasts.push({ key: toastKey++, text: `Succès — ${achievementById(id)!.name}` });
      }
      return { ...next, playtimeMs, achievements, toasts };
    }),
  click: () => set(applyClick),

  setDriveTarget: (target) => set({ driveTarget: target }),
  setBuyQuantity: (q) => set({ buyQuantity: q }),
  setAllocation: (allocation) => set({ allocation }),
  setMinigame: (minigame) => set({ minigame }),

  buyGenerator: (id) => set((s) => applyBuyGenerator(s, id)),
  buyTech: (id) => set((s) => applyBuyTech(s, id)),
  buyUpgrade: (id) => set((s) => applyBuyUpgrade(s, id)),

  hydrate: (state) => set({ ...state }),
  hardReset: () => set({ ...initialState() }),
}));

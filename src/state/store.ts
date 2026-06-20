import { create } from 'zustand';
import type { Allocation, BuyQuantity, DriveTarget, GameState } from '../model/types';
import { step } from '../model/engine';
import {
  applyBuyGenerator,
  applyBuyTech,
  applyBuyUpgrade,
  applyClick,
  initialState,
} from '../model/actions';

// Store Zustand : source de vérité + actions. Cf. architecture §2. Les RÈGLES vivent dans
// model/actions.ts (réducteurs purs), partagées avec le banc de simulation → zéro divergence.
// La game loop (core/loop) mute ce store via tick() ; React s'abonne à des slices.

export { initialState };

export interface GameStore extends GameState {
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

  tick: (dt) => set((s) => step(s, dt)),
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

import type { ComponentType } from 'react';
import { DawnBootstrap } from './DawnBootstrap';
import { EnergyMix } from './EnergyMix';
import { DysonYard } from './DysonYard';

// Mini-jeu actif par tier (cf. architecture §11 / 05_mechanics §3). Une seule mécanique active à la
// fois ; PhaseView monte le module du tier courant et démonte le précédent (culling).
const REGISTRY: Record<number, ComponentType> = {
  0: DawnBootstrap, // Amorçage (créer/automatiser les premiers Humains)
  1: EnergyMix, // Mix énergétique
  2: DysonYard, // Chantier orbital (transition Dyson)
};

export function minigameForTier(tier: number): ComponentType | null {
  return REGISTRY[tier] ?? null;
}

import type { ComponentType } from 'react';
import { EnergyMix } from './EnergyMix';
import { DysonYard } from './DysonYard';

// Mini-jeu actif par tier (cf. architecture §11 / 05_mechanics §3). Une seule mécanique active à la
// fois ; PhaseView monte le module du tier courant et démonte le précédent (culling).
// Tier 0 : pas de module — l'amorçage EST le clic (ClickTarget), rien à afficher en plus.
const REGISTRY: Record<number, ComponentType> = {
  1: EnergyMix, // Mix énergétique
  2: DysonYard, // Chantier orbital (transition Dyson)
};

export function minigameForTier(tier: number): ComponentType | null {
  return REGISTRY[tier] ?? null;
}

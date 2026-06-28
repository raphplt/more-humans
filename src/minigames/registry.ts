import type { ComponentType } from 'react';
import { DawnBootstrapView } from './DawnBootstrapView';
import { EnergyMixView } from './EnergyMixView';
import { DysonYardView } from './DysonYardView';

// Mini-jeu actif par tier (cf. architecture §11 / 05_mechanics §3). Une seule mécanique active à la
// fois ; PhaseView monte le module du tier courant et démonte le précédent (culling).
const REGISTRY: Record<number, ComponentType> = {
  0: DawnBootstrapView, // Amorçage (progression vers la masse critique)
  1: EnergyMixView, // Mix énergétique
  2: DysonYardView, // Chantier orbital (transition Dyson)
};

export function minigameForTier(tier: number): ComponentType | null {
  return REGISTRY[tier] ?? null;
}

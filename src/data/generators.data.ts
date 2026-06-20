import Decimal from 'break_infinity.js';
import type { GeneratorDef } from '../model/types';

// Contenu data-driven. Chiffres = DRAFT d'équilibrage (se cale manette en main, cf. content §8).
// `discover` = condition d'APPARITION (révélation progressive, cf. architecture §10) ; à défaut on
// retombe sur `unlock`. L'écran de départ est quasi nu. Les générateurs d'un tier < tier courant
// sont cull-és (repliés) automatiquement (cf. model/culling).
export const GENERATORS: GeneratorDef[] = [
  // ---------- Tier 0 — L'Aube ----------
  {
    id: 'hunting_band',
    tier: 0,
    name: 'Bande de chasseurs-cueilleurs',
    description: 'Automatise les naissances : produit de la population en continu (autoclicker).',
    produces: { population: new Decimal(1) }, // alimente le terme additif d'amorçage A
    baseCost: { resources: new Decimal(5) }, // payé en Ressources (JAMAIS en Humains)
    costGrowth: 1.15,
    discover: { kind: 'resource', resource: 'population', atLeast: new Decimal(1) },
  },
  {
    id: 'farmland',
    tier: 0,
    name: 'Champs cultivés',
    description: 'Surplus alimentaire : produit des Ressources, relève la capacité ET active la reproduction.',
    produces: { resources: new Decimal(2) },
    baseCost: { resources: new Decimal(20) },
    costGrowth: 1.1,
    discover: { kind: 'resource', resource: 'population', atLeast: new Decimal(20) },
    effects: [{ kind: 'raiseCapacity', factor: 1.08 }],
  },
  {
    id: 'woodfire',
    tier: 0,
    name: 'Foyers & combustion',
    description: 'Première source de puissance harnachée (W).',
    produces: { energy: new Decimal(5) },
    baseCost: { resources: new Decimal(10) },
    costGrowth: 1.15,
    discover: { kind: 'resource', resource: 'resources', atLeast: new Decimal(8) },
  },
  {
    id: 'scholars',
    tier: 0,
    name: 'Lettrés',
    description: 'Une fraction de la population produit du savoir.',
    produces: { knowledge: new Decimal(0.5) },
    baseCost: { energy: new Decimal(50) },
    costGrowth: 1.2,
    discover: { kind: 'resource', resource: 'energy', atLeast: new Decimal(20) },
  },
  {
    id: 'coal_plant',
    tier: 0,
    name: 'Centrale à charbon',
    description: "Grand saut d'énergie fossile — ouvre la voie au Tier I.",
    produces: { energy: new Decimal(500) },
    baseCost: { resources: new Decimal(5000), energy: new Decimal(1000) },
    costGrowth: 1.18,
    unlock: { kind: 'tech', id: 'metallurgy' },
  },

  // ---------- Tier I — Planétaire (cf. content §4) ----------
  {
    id: 'oil_plant',
    tier: 1,
    name: 'Raffinerie & thermique',
    description: 'Énergie fossile industrielle à grande échelle.',
    produces: { energy: new Decimal('1e5') },
    baseCost: { resources: new Decimal('5e4') },
    costGrowth: 1.18,
    unlock: { kind: 'tier', atLeast: 1 },
  },
  {
    id: 'fission_reactor',
    tier: 1,
    name: 'Réacteur à fission',
    description: 'Saut nucléaire : forte densité énergétique.',
    produces: { energy: new Decimal('5e7') },
    baseCost: { resources: new Decimal('1e7'), energy: new Decimal('5e6') },
    costGrowth: 1.2,
    unlock: { kind: 'tech', id: 'electrification' },
  },
  {
    id: 'solar_array',
    tier: 1,
    name: 'Champ solaire',
    description: 'Renouvelable massif, plafonné par l’ensoleillement.',
    produces: { energy: new Decimal('2e7') },
    baseCost: { resources: new Decimal('2e7') },
    costGrowth: 1.18,
    unlock: { kind: 'tech', id: 'renewables' },
  },
  {
    id: 'wind_farm',
    tier: 1,
    name: 'Parc éolien',
    description: 'Renouvelable complémentaire du solaire.',
    produces: { energy: new Decimal('1e7') },
    baseCost: { resources: new Decimal('1e7') },
    costGrowth: 1.18,
    unlock: { kind: 'tech', id: 'renewables' },
  },
  {
    id: 'fusion_reactor',
    tier: 1,
    name: 'Réacteur à fusion',
    description: 'Fin de Tier I : énergie quasi-stellaire au sol.',
    produces: { energy: new Decimal('5e11') },
    baseCost: { resources: new Decimal('5e11'), energy: new Decimal('1e11') },
    costGrowth: 1.22,
    unlock: { kind: 'tech', id: 'fusion' },
  },
];

export function generatorById(id: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.id === id);
}

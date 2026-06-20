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
    description: 'Première automatisation : ramène lentement de nouveaux Humains.',
    produces: { population: new Decimal('0.06') }, // autoclicker lent (alimente l'additif d'amorçage)
    baseCost: { food: new Decimal(80) }, // payé en Vivres (JAMAIS en Humains)
    costGrowth: 1.3,
    discover: { kind: 'resource', resource: 'population', atLeast: new Decimal(25) },
  },
  {
    id: 'farmland',
    tier: 0,
    name: 'Champs cultivés',
    description: 'Agriculture : relève la capacité ET fait croître la population d’elle-même.',
    produces: {},
    baseCost: { food: new Decimal(300) },
    costGrowth: 1.22,
    discover: { kind: 'resource', resource: 'population', atLeast: new Decimal(25) },
    effects: [{ kind: 'raiseFoodCeiling', amount: 25 }], // +25 à la capacité de population par ferme
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

  // ---------- Tier II — Stellaire / essaim de Dyson (cf. content §5) ----------
  {
    id: 'asteroid_mining',
    tier: 2,
    name: "Minage d'astéroïdes",
    description: "Matière première de l'essaim : énormément de Ressources.",
    produces: { resources: new Decimal('1e9') },
    baseCost: { resources: new Decimal('1e8'), energy: new Decimal('1e15') },
    costGrowth: 1.18,
    unlock: { kind: 'tier', atLeast: 2 },
  },
  {
    id: 'orbital_collector',
    tier: 2,
    name: 'Collecteur orbital',
    description: "Capte l'énergie du Soleil — palier de l'essaim de Dyson vers le Type II.",
    produces: { energy: new Decimal('1e22') },
    baseCost: { resources: new Decimal('1e16') },
    costGrowth: 1.2,
    unlock: { kind: 'tier', atLeast: 2 },
  },
  {
    id: 'space_habitat',
    tier: 2,
    name: 'Habitat spatial',
    description: 'La population vit hors-sol : relève fortement la capacité.',
    produces: {},
    baseCost: { resources: new Decimal('1e15'), energy: new Decimal('1e18') },
    costGrowth: 1.18,
    unlock: { kind: 'tier', atLeast: 2 },
    effects: [{ kind: 'raiseCapacity', factor: 1.2 }],
  },
];

export function generatorById(id: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.id === id);
}

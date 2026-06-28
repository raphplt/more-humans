import Decimal from 'break_infinity.js';

// Le contrat de données du jeu. Cf. architecture §4.
// Toute grandeur de jeu est un `Decimal` (break_infinity), jamais un `number` natif.

// 'population' = LE score (ne se dépense JAMAIS, ne fait que monter).
// 'food'       = Vivres : CONSOMMÉE par la population ; produite par la cueillette (plafonnée) + fermes.
// 'resources'  = Matière : monnaie de construction (produite par le LABEUR de la population).
// 'knowledge'  = monnaie de recherche (dépensée pour les techs).
// 'energy'     = PUISSANCE harnachée (W) : grandeur DÉRIVÉE (somme des sorties × multiplicateurs),
//                jamais accumulée ni dépensée → moteur de capacité + porte Kardashev. Cf. game-design §3.2.
export type ResourceId = 'population' | 'food' | 'resources' | 'knowledge' | 'energy';

/** Ressources dépensables (monnaies) — jamais la population. */
export type SpendableId = Exclude<ResourceId, 'population'>;

export interface ResourceState {
  amount: Decimal;
}

/** Un producteur achetable : autoclicker, centrale, ferme, habitat orbital, nœud de calcul… */
export interface GeneratorDef {
  id: string;
  tier: number; // tier Kardashev d'apparition
  name: string;
  description?: string; // détail À LA DEMANDE seulement (jamais imposé en permanence)
  produces: Partial<Record<ResourceId, Decimal>>; // par unité, par seconde
  baseCost: Partial<Record<ResourceId, Decimal>>;
  costGrowth: number; // ex. 1.15 → coût × 1.15 par achat
  unlock?: UnlockCondition; // achetable seulement si rempli
  discover?: UnlockCondition; // RÉVÉLÉ (apparaît) si rempli ; défaut = unlock. Cf. architecture §10
  effects?: Effect[]; // ex. relève la capacité, multiplie une prod
}

/**
 * Amélioration INCRÉMENTALE : un levier qu'on monte en NIVEAU (le clic « monte d'un étage » de
 * l'item de base vers les améliorations). `effects` s'appliquent PAR NIVEAU ; `cost` est le coût de
 * base, croissant via `costGrowth`. L'enjeu actif = quel levier monter en priorité.
 */
export interface UpgradeDef {
  id: string;
  tier: number;
  name: string;
  description?: string;
  cost: Partial<Record<ResourceId, Decimal>>;
  costGrowth: number; // coût × ce facteur par niveau
  maxLevel?: number; // certains leviers plafonnent
  unlock?: UnlockCondition;
  discover?: UnlockCondition;
  effects: Effect[]; // appliqués une fois PAR NIVEAU
}

/** Nœud de l'arbre techno. Porte la transformation de phase et les choix (exclusifs plus tard). */
export interface TechDef {
  id: string;
  tier: number;
  name: string;
  description?: string;
  cost: { knowledge: Decimal };
  requires?: string[]; // prérequis (autres tech ids)
  discover?: UnlockCondition;
  exclusiveGroup?: string; // pour la couche roguelite : un seul par groupe
  effects: Effect[];
  unlocksTierTransition?: number; // ex. débloque la sphère de Dyson → tier II
}

export interface TierDef {
  level: number; // 0,1,2,3
  name: string; // "Aube", "Planétaire", "Stellaire", "Galactique"
  energyThreshold: Decimal; // puissance (W) requise pour franchir CE tier
  dominantActivity: string; // texte de design : ce que le joueur fait surtout ici
  capacityModel: string; // comment la capacité de charge est calculée à ce tier
}

/** Effet déclaratif appliqué par les formules. Étendre l'enum, pas la logique. */
export type Effect =
  | { kind: 'multiplyProduction'; resource: ResourceId; factor: number }
  | { kind: 'raiseCapacity'; factor: number }
  | { kind: 'raiseFoodCeiling'; amount: number } // fermes/agriculture : + plafond de Vivres
  | { kind: 'multiplyClick'; factor: number }
  | { kind: 'unlockGenerator'; id: string }
  | { kind: 'unlockTier'; level: number };

export type UnlockCondition =
  | { kind: 'resource'; resource: ResourceId; atLeast: Decimal }
  | { kind: 'tier'; atLeast: number }
  | { kind: 'tech'; id: string }
  | { kind: 'all'; of: UnlockCondition[] };

export type DriveTarget = 'growth' | 'research' | 'construction';

/** Répartition de la population entre tâches (poids relatifs). Cœur de la boucle Tier 0. */
export interface Allocation {
  forage: number; // cueillette → Vivres
  labor: number; // labeur → Matière
}

/** Régime du clic, DÉRIVÉ de l'état (pas un champ figé). Cf. 05_mechanics §1.3. */
export type ClickRegime = 'bootstrap' | 'drive';

export type BuyQuantity = 1 | 10 | 100;

// Un seul thème désormais (choix radical, cf. design-revelation-core). Conservé en union d'un
// élément pour garder le contrat de save stable.
export type ThemeName = 'instrument';

export interface Settings {
  notation: 'full'; // CHIFFRES PLEINS uniquement (cf. architecture §6). 'scientific'/'named' supprimés.
  theme: ThemeName; // charte active (design tokens). Toujours 'instrument'.
  transhumanLabels: boolean; // flag : relabellisation cosmétique tardive (cf. game-design §3.4)
}

export interface GameState {
  resources: Record<ResourceId, ResourceState>;
  capacity: Decimal; // capacité de charge courante (pop max soutenable)
  tier: number; // tier Kardashev courant
  owned: Record<string, number>; // générateurs possédés (compte) — inclut l'autoclicker
  purchased: Record<string, boolean>; // techs achetées (achat unique)
  upgradeLevels: Record<string, number>; // améliorations incrémentales : niveau par id
  clickPower: Decimal; // Humains créés par clic (amorçage) / poussée par clic (pilotage)
  // accélérant du clic et sa cible (le "goulot" choisi), en régime pilotage
  drive: Decimal;
  driveTarget: DriveTarget;
  // --- boucle de subsistance Tier 0 : répartition de la population ---
  allocation: Allocation;
  // --- amorçage & automatisation (cf. 05_mechanics §1-2) ---
  // Réservé : on peut distinguer les autoclickers de l'UI. En pratique l'autoclicker (hunting_band)
  // vit dans `owned` comme un générateur de population. Gardé pour le contrat de schéma.
  autoclickers: Record<string, number>;
  // --- achat groupé (cf. architecture §8) ---
  buyQuantity: BuyQuantity;
  // --- révélation progressive (cf. architecture §10) ---
  discovered: Record<string, boolean>; // ids déjà RÉVÉLÉS (un révélé ne se re-cache pas)
  // --- mini-jeu actif du tier (état opaque, géré par le module) ---
  minigame?: unknown;
  // --- instrumentation / rétention ---
  totalClicks: number;
  playtimeMs: number; // temps de jeu ACTIF cumulé (hors-ligne non compté)
  achievements: Record<string, boolean>; // succès débloqués
  lastSaved: number; // timestamp (ms) pour la progression hors-ligne
  settings: Settings;
}

/** Bilan de la progression hors-ligne, présenté au retour du joueur. */
export interface OfflineRecap {
  elapsedMs: number;
  populationGain: Decimal;
}

/** Succès : objectif à atteindre (carotte court terme), détecté par un prédicat pur sur l'état. */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  test: (state: GameState) => boolean;
}

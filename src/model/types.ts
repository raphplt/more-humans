import Decimal from 'break_infinity.js';

// Le contrat de données du jeu. Cf. architecture §4.
// Toute grandeur de jeu est un `Decimal` (break_infinity), jamais un `number` natif.

// 'population' = LE score (ne se dépense JAMAIS, ne fait que monter).
// 'resources'  = monnaie générale de construction (produite par la pop + les bâtiments).
// 'knowledge'  = monnaie de recherche (dépensée pour les techs).
// 'energy'     = puissance harnachée (W) → moteur de capacité + porte Kardashev (dépensable).
export type ResourceId = 'population' | 'resources' | 'knowledge' | 'energy';

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

/** Achat unique qui modifie des multiplicateurs/règles. */
export interface UpgradeDef {
  id: string;
  tier: number;
  name: string;
  description?: string;
  cost: Partial<Record<ResourceId, Decimal>>;
  unlock?: UnlockCondition;
  discover?: UnlockCondition;
  effects: Effect[];
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
  | { kind: 'multiplyClick'; factor: number }
  | { kind: 'unlockGenerator'; id: string }
  | { kind: 'unlockTier'; level: number };

export type UnlockCondition =
  | { kind: 'resource'; resource: ResourceId; atLeast: Decimal }
  | { kind: 'tier'; atLeast: number }
  | { kind: 'tech'; id: string }
  | { kind: 'all'; of: UnlockCondition[] };

export type DriveTarget = 'growth' | 'research' | 'construction';

/** Régime du clic, DÉRIVÉ de l'état (pas un champ figé). Cf. 05_mechanics §1.3. */
export type ClickRegime = 'bootstrap' | 'drive';

export type BuyQuantity = 1 | 10 | 100;

export type ThemeName = 'instrument' | 'brutalist' | 'cosmic';

export interface Settings {
  notation: 'full'; // CHIFFRES PLEINS uniquement (cf. architecture §6). 'scientific'/'named' supprimés.
  theme: ThemeName; // charte active (design tokens, cf. architecture §9). Défaut : 'instrument'.
  transhumanLabels: boolean; // flag : relabellisation cosmétique tardive (cf. game-design §3.4)
}

export interface GameState {
  resources: Record<ResourceId, ResourceState>;
  capacity: Decimal; // capacité de charge courante (pop max soutenable)
  tier: number; // tier Kardashev courant
  owned: Record<string, number>; // générateurs possédés (compte) — inclut l'autoclicker
  purchased: Record<string, boolean>; // upgrades/techs achetés
  clickPower: Decimal; // Humains créés par clic (amorçage) / poussée par clic (pilotage)
  // accélérant du clic et sa cible (le "goulot" choisi), en régime pilotage
  drive: Decimal;
  driveTarget: DriveTarget;
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
  lastSaved: number; // timestamp (ms) pour la progression hors-ligne
  settings: Settings;
}

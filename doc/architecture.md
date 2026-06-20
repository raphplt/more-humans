# More Humans — Architecture technique

## 1. Stack

| Choix | Outil | Pourquoi |
|---|---|---|
| Langage | **TypeScript** | Force du dev, l'IA excelle, typage = contrat clair |
| Build/dev | **Vite** (SPA) | Rapide, simple, pas de SSR (un clicker est 100 % client). Pas de Next.js. |
| UI / state | **React + Zustand** | Connu, simple, abonnements sélectifs. **La game loop reste HORS de React.** |
| Grands nombres | **break_infinity.js** (`Decimal`) | **Obligatoire dès le jour 1.** Les coûts/multiplicateurs dépassent vite `Number`. |
| Style | **Tailwind CSS** | Rapide, l'IA gère bien |
| Persistance | **localStorage** + export/import (string base64) | Autosave + sauvegarde portable |

Cible de déploiement : un site statique (Vercel/Netlify/Pages). Wrappable plus tard via **Tauri**
pour Steam, sans toucher au cœur.

## 2. Règles non négociables (l'IA les rate souvent)

1. **`Decimal` (break_infinity) pour TOUTE valeur de jeu** : ressources, coûts, productions,
   capacités, multiplicateurs. Jamais de `number` natif pour ces grandeurs. Retrofit = enfer.
2. **Game loop découplée de React.** Un module `core/loop` tourne en `setInterval`/`rAF`, mute le
   store via une voie non-réactive ; React **s'abonne à des slices**. Pas de calcul de jeu dans le rendu.
3. **Tick à pas fixe.** Accumuler le `dt` réel, simuler par pas fixes (ex. 100 ms) → simulation stable,
   indépendante du framerate, et progression hors-ligne = rejouer N pas d'un coup (plafonné).
4. **Data-driven.** La logique (formules, boucle) est écrite une fois dans `model/`. Le **contenu**
   (générateurs, upgrades, techs, tiers) vit en données conformes aux interfaces du §4.
   Étendre le jeu = ajouter des objets de données.
5. **Tout passe par les formules centralisées** (`model/formulas.ts`) : coût, production, capacité.
   Aucune formule en dur dans l'UI ou les données.

## 3. Structure des modules

```
src/
  core/
    loop.ts          # tick à pas fixe, boucle rAF/interval, hors React
    time.ts          # timestamp, calcul de progression hors-ligne (plafonnée)
    rng.ts           # PRNG seedé (pour la couche roguelite future)
  state/
    store.ts         # Zustand : état + actions ; source de vérité
    save.ts          # serialize/deserialize, autosave, export/import base64
    schema.ts        # version de save + migrations
  model/
    types.ts         # toutes les interfaces du §4
    formulas.ts      # coût, production, capacité, croissance logistique
    engine.ts        # applique un tick : énergie → capacité → pop (terme ADDITIF d'amorçage
                     #   + logistique) → savoir → unlocks. Cf. 05_mechanics §1 pour l'additif.
    tiers.ts         # logique de palier Kardashev + conditions de transition
  data/
    constants.ts     # constantes physiques (voir content.md)
    tiers.data.ts    # définition des tiers
    generators.data.ts
    upgrades.data.ts
    techs.data.ts
  format/
    notation.ts      # formatage des Decimal → CHIFFRES PLEINS (jamais d'exposant), unités (W, hab.)
  theme/
    tokens.css       # design tokens par défaut (:root) + variantes par [data-theme="…"]
    ThemeProvider.tsx# pose data-theme sur <html>, persiste le choix
  minigames/
    registry.ts      # mini-jeu actif par tier (data-driven), monté/démonté à la transition
    DawnBootstrap.tsx, EnergyMix.tsx, DysonYard.tsx, …  # un module par tier
  ui/
    App.tsx
    ResourceBar.tsx  # Population, Énergie (W + tier Kardashev), Savoir
    GeneratorList.tsx# achat ×1/×10/×100 (cf. §8), éléments cull-és repliés
    TechTree.tsx
    ClickTarget.tsx  # clic : régime amorçage (crée pop) puis pilotage (alloue)
    PhaseView.tsx    # vue du tier courant, méga-projets, monte le mini-jeu du tier
    Discoverable.tsx # wrapper de révélation progressive (présent/absent, pas grisé)
    Modals/ Codex/   # plus tard
  main.tsx
```

## 4. Contrat de données (interfaces — le cœur de la build-ability)

```ts
import Decimal from 'break_infinity.js';

export type ResourceId = 'population' | 'energy' | 'knowledge';

export interface ResourceState {
  amount: Decimal;
  // 'energy' représente la PUISSANCE harnachée (W) → détermine le tier Kardashev.
}

/** Un producteur achetable : centrale, ferme, habitat orbital, nœud de calcul… */
export interface GeneratorDef {
  id: string;
  tier: number;                 // tier Kardashev d'apparition
  name: string;
  produces: Partial<Record<ResourceId, Decimal>>;  // par unité, par seconde
  baseCost: Partial<Record<ResourceId, Decimal>>;
  costGrowth: number;           // ex. 1.15 → coût × 1.15 par achat
  unlock?: UnlockCondition;     // visible/achetable seulement si rempli
  effects?: Effect[];           // ex. relève la capacité, multiplie une prod
}

/** Achat unique qui modifie des multiplicateurs/règles. */
export interface UpgradeDef {
  id: string;
  tier: number;
  name: string;
  cost: Partial<Record<ResourceId, Decimal>>;
  unlock?: UnlockCondition;
  effects: Effect[];
}

/** Nœud de l'arbre techno. Porte la transformation de phase et les choix (exclusifs plus tard). */
export interface TechDef {
  id: string;
  tier: number;
  name: string;
  cost: { knowledge: Decimal };
  requires?: string[];          // prérequis (autres tech ids)
  exclusiveGroup?: string;      // pour la couche roguelite : un seul par groupe
  effects: Effect[];
  unlocksTierTransition?: number; // ex. débloque la sphère de Dyson → tier II
}

export interface TierDef {
  level: number;                // 0,1,2,3
  name: string;                 // "Aube", "Planétaire", "Stellaire", "Galactique"
  energyThreshold: Decimal;     // puissance (W) requise pour franchir CE tier
  dominantActivity: string;     // texte de design : ce que le joueur fait surtout ici
  capacityModel: string;        // comment la capacité de charge est calculée à ce tier
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

export interface GameState {
  resources: Record<ResourceId, ResourceState>;
  capacity: Decimal;            // capacité de charge courante (pop max soutenable)
  tier: number;                 // tier Kardashev courant
  owned: Record<string, number>;       // générateurs possédés (compte)
  purchased: Record<string, boolean>;  // upgrades/techs achetés
  clickPower: Decimal;
  // accélérant du clic et sa cible (le "goulot" choisi)
  drive: Decimal;
  driveTarget: 'growth' | 'research' | 'construction';
  // --- amorçage & automatisation (cf. 05_mechanics §1-2) ---
  autoclickers: Record<string, number>; // autoclickers possédés (cps automatisés)
  // --- achat groupé (cf. §8) ---
  buyQuantity: 1 | 10 | 100;            // multiplicateur d'achat courant choisi par le joueur
  // --- révélation progressive (cf. game-design §8.2) ---
  discovered: Record<string, boolean>;  // ids déjà RÉVÉLÉS (un élément révélé ne se re-cache pas)
  // --- mini-jeu actif du tier (état opaque, géré par le module) ---
  minigame?: unknown;
  lastSaved: number;            // timestamp pour la progression hors-ligne
  settings: Settings;
}

export interface Settings {
  notation: 'full';            // CHIFFRES PLEINS uniquement (cf. §6). 'scientific' supprimé.
  theme: 'instrument' | 'brutalist' | 'cosmic'; // charte active (cf. §theming)
  transhumanLabels: boolean;   // flag relabellisation tardive (game-design §3.4)
}
```

> **Note d'évolution de schéma.** Ces champs (`autoclickers`, `buyQuantity`, `discovered`,
> `minigame`, `settings.theme`) sont des ajouts par rapport au scaffold initial : bumper la version
> de save dans `schema.ts` et écrire la migration (défauts : `{}`, `1`, `{}`, `undefined`,
> `'instrument'`). Une save existante ne doit jamais casser.

## 5. Sauvegarde & hors-ligne

- Autosave toutes ~10 s dans localStorage ; sérialiser les `Decimal` en string.
- `schema.ts` porte un numéro de version + migrations (les saves doivent survivre aux updates).
- À la reprise : `elapsed = now − lastSaved`, plafonné (ex. 8 h), rejouer en pas fixes via `engine.ts`
  pour calculer la production hors-ligne (afficher un récap "pendant ton absence : +X").
- Export/import : `GameState` → JSON → base64, pour partager/sauvegarder une partie.

## 6. Formatage des nombres — chiffres pleins, jamais d'exposant

`format/notation.ts` : à partir d'un `Decimal`, produire **le nombre entier complet**, avec
séparateurs de milliers fins. **Interdit :** notation scientifique (`1.23e16`), puissances (`10⁷`),
exposants en exposant typographique. Le joueur veut voir `10000000`, pas `10⁷`.

- Implémentation : `Decimal` → chaîne décimale entière (tronquée aux unités au-delà d'un seuil),
  regroupement par milliers. break_infinity expose la mantisse + l'exposant ; reconstruire la chaîne
  pleine sans repasser par `Number` (qui ment au-delà de ~1e21).
- **Très grandes échelles (endgame, ~10²⁰⁺) :** garder le principe « chiffres pleins ». Si la
  longueur devient ingérable, l'unique repli autorisé est **les mots français pleins** (« 100
  milliards », « 2 billions »), jamais un exposant. Le défaut reste le chiffre brut. Décision et
  seuils dans `05_mechanics §4`.
- Affichage **unité-conscient** : Population en habitants, Énergie en W avec le **tier Kardashev**
  courant affiché à côté (ex. `380000000… W — Type II`). Le type Kardashev fractionnaire (Sagan)
  reste affiché comme repère de progression.

## 7. Ordre de build (jalons)

1. **Squelette** : Vite + TS + Tailwind + Zustand + break_infinity. `types.ts`, store vide, boucle
   fixe qui tourne et tick à vide.
2. **Boucle centrale** : Population (logistique vers `capacity`), Énergie, Savoir + `formulas.ts`.
   Un seul générateur d'énergie et un seul de savoir codés en données. UI : ResourceBar + GeneratorList.
3. **Clic stratégique** : `drive`, cible de goulot, multiplicateur actif. ClickTarget.
4. **Tier 0 complet** (contenu data) + premières upgrades + un mini arbre techno.
5. **Sauvegarde + hors-ligne + export/import**.
6. **Tier I** (contenu) + transformation de phase (nouveau système, mur planétaire).
7. **Transition Dyson / Tier II** (méga-projet) → fin v1.
8. **Formatage avancé, codex, polish (juice : sons, particules, transitions).**
9. *(plus tard)* couche roguelite, tiers II complet → III → endgame entropie.

> **Jalon « art direction ».** La refonte visuelle (tokens + thème instrument) et la révélation
> progressive ne sont pas le jalon 8 « polish » : elles s'installent **avant** d'empiler du contenu,
> car elles changent la structure des composants (Discoverable, ResourceBar, etc.). Voir `04_art_direction`.

## 8. Achat groupé ×1 / ×10 / ×100

Les générateurs (et autoclickers) s'achètent par lots : un sélecteur global `buyQuantity ∈ {1,10,100}`.

- **Déblocage progressif :** ×1 d'emblée ; ×10 apparaît quand le joueur a acheté assez d'unités
  (ou atteint un tier) ; ×100 plus tard encore. On *ne montre pas* ×10/×100 grisés tant qu'ils ne
  sont pas débloqués (révélation progressive — ils apparaissent).
- **Formule de coût d'un lot de N** (somme géométrique, à centraliser dans `formulas.ts`, **ne pas**
  boucler N fois en achetant) :
  `coût(owned, N) = base · g^owned · (g^N − 1) / (g − 1)` où `g = costGrowth`.
- **Achat « max abordable »** (optionnel, plus tard) : inverse de la somme géométrique pour trouver
  le plus grand N payable. Garder la porte ouverte dans la signature de `formulas`.
- L'UI affiche le coût du **lot courant** et n'autorise l'achat que si tout le lot est payable
  (pas d'achat partiel), pour rester lisible.

## 9. Système de thèmes (design tokens) — `theme/`

Réponse à « pouvoir switcher de charte facilement » : **pas** trois jeux de classes Tailwind, mais
**un seul jeu de design tokens** (variables CSS) dont les valeurs changent selon `data-theme`.

```css
/* theme/tokens.css */
:root, [data-theme="instrument"] {
  --bg: …; --surface: …; --line: …; --text: …; --muted: …; --accent: …;
  --font-ui: …; --font-num: …; --radius: …; --space-unit: …;
}
[data-theme="brutalist"] { --bg: …; --accent: …; /* … overrides … */ }
[data-theme="cosmic"]    { --bg: …; --accent: …; /* … overrides … */ }
```

- **Tailwind consomme les tokens**, il ne les remplace pas : configurer le thème Tailwind pour que
  `bg-surface`, `text-muted`, `border-line`, etc. pointent vers `var(--…)` (via `@theme` /
  config). Les composants n'utilisent **que** ces classes sémantiques — jamais `slate-700` en dur.
- `ThemeProvider` pose `data-theme` sur `<html>` et persiste `settings.theme`. Changer de charte =
  changer un attribut, **zéro modif de composant**, transition instantanée.
- Règle : **aucune couleur littérale dans les composants.** Toute valeur visuelle passe par un token.
  C'est ce qui rend les trois directions de `04_art_direction` interchangeables.

## 10. Révélation progressive (implémentation)

- `discovered: Record<id, boolean>` dans l'état : une fois un élément révélé, il le reste (pas de
  clignotement). Le moteur marque `discovered[id] = true` quand sa condition d'apparition est
  atteinte (peut être plus permissive que sa condition d'*achat*).
- Composant `Discoverable` : rend `children` **uniquement** si découvert, avec une micro-transition
  d'entrée. **Jamais de rendu grisé** d'un élément non découvert — il est absent du DOM.
- Distinguer trois états : *non découvert* (absent) → *découvert mais non abordable* (visible, action
  inerte/discrète, sans gros « LOCKED ») → *abordable* (action mise en avant). Pas de quatrième état
  « grisé révélant le futur ».

## 11. Mini-jeux par tier — `minigames/`

- `registry.ts` mappe `tier → module de mini-jeu`. `PhaseView` monte le module du tier courant et
  démonte celui du tier précédent à la transition (culling : le mini-jeu d'avant disparaît).
- Chaque mini-jeu est **isolé** : son état vit dans `state.minigame` (forme opaque au cœur), il
  expose une API minimale (`init`, `tick?`, des actions) et communique avec le moteur **uniquement**
  via des effets déclaratifs (mêmes `Effect`/ressources que le reste). Aucun mini-jeu ne touche
  directement l'`engine`.
- Désactivable/remplaçable sans casser le cœur, comme le module transhumaniste. Catalogue et règles
  de game-feel dans `05_mechanics §3`.
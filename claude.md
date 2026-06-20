# More Humans — CLAUDE.md

Manuel d'opération pour tout agent IA travaillant sur ce projet. **Lis ce fichier en premier**,
puis les docs de design dans l'ordre. Prose en français, code/commandes/identifiants en anglais.

---

## Le jeu en une phrase

**More Humans** : un incrémental web où l'on fait croître l'humanité du néolithique jusqu'aux
limites physiques de l'univers, le long de l'échelle de Kardashev. Esprit Paperclips (arc +
transformation de phase + vraie fin) et Cookie Clicker (boucle de croissance), ancré dans la
physique réelle.

## Docs de référence (à lire avant d'écrire du code)

- `doc/game-design.md` — vision, piliers, modèle de métrique, boucle centrale, **direction
  artistique & UX** (§8), **mini-jeux** (§9), périmètre.
- `doc/architecture.md` — stack, structure des modules, **contrat d'interfaces TypeScript**,
  notation chiffres pleins (§6), achat ×1/×10/×100 (§8), **thèmes/tokens** (§9), révélation
  progressive (§10), **mini-jeux** (§11), jalons.
- `doc/content.md` — constantes physiques, tiers Kardashev (contenu), mécanique par tier, **culling**.
- `doc/04_art_direction.md` — charte graphique commutable, **instrument scientifique** (défaut),
  UX de révélation progressive.
- `doc/05_mechanics.md` — clic d'amorçage (départ à 0), autoclicker, mini-jeux, achat groupé, notation.

Ce CLAUDE.md ne duplique pas ces docs : il fixe les règles à respecter en codant. En cas de doute
de design, les docs font foi ; ne pas inventer de mécanique non décrite sans le signaler.

## Stack

- **TypeScript** (strict) + **Vite** (SPA, pas de SSR, pas de Next).
- **React + Zustand** pour l'UI/state.
- **break_infinity.js** (`Decimal`) pour tous les nombres de jeu.
- **Tailwind CSS** pour le style.
- Persistance : **localStorage** + export/import (string base64).
- Déploiement : site statique. Wrappable Tauri plus tard pour Steam.

## Règles NON NÉGOCIABLES

1. **`Decimal` (break_infinity) pour TOUTE grandeur de jeu** — ressources, coûts, productions,
   capacités, multiplicateurs. Jamais de `number` natif pour ça. C'est la règle la plus violée :
   y faire attention en permanence.
2. **La game loop tourne HORS de React.** `core/loop.ts` (interval/rAF) mute le store ; React
   s'abonne à des slices. Aucun calcul de jeu dans le rendu / `useEffect` de composant.
3. **Tick à pas fixe** (ex. 100 ms) : accumuler le `dt` réel, simuler par pas fixes. Indépendant
   du framerate, et permet la progression hors-ligne (rejouer N pas, plafonnés).
4. **Data-driven.** La logique (boucle, formules) est écrite une fois dans `model/`. Le **contenu**
   (générateurs, upgrades, techs, tiers) vit en données conformes aux interfaces de `architecture`.
   Étendre le jeu = ajouter des entrées de données, pas réécrire la logique.
5. **Toutes les formules sont centralisées** dans `model/formulas.ts` (coût, production, capacité,
   croissance logistique). Aucune formule en dur dans l'UI ou les fichiers de données.
6. **Une seule métrique spine, jamais relabellisée : la Population.** C'est le score, du début à
   la fin. L'**Énergie** (W) est le moteur + la porte de Kardashev, **pas** le score.
7. **Le clic a deux régimes.** Au **tout début** (amorçage, P≈0), c'est un **spam `+1` assumé** : le
   clic crée des Humains (c'est l'accroche). Garde-fou = le rendre **court** (autoclicker très tôt),
   pas l'interdire. **Ensuite** (pilotage), il devient stratégique : il oriente/multiplie le moteur
   idle (allocation sur le goulot), plus de `+1`. Principe : l'idle produit, l'actif multiplie.
   Cf. `game-design §4-4.1`, `05_mechanics §1`.
8. **Le virage transhumaniste est une *méthode* de croissance, pas un changement de métrique.** Toute
   relabellisation cosmétique tardive vit dans un module isolé, **derrière un flag**, et doit pouvoir
   être coupée sans rien casser.
9. **La population démarre à 0.** Le clic *crée* les premiers Humains (régime amorçage, terme additif
   `A` dans le moteur), puis bascule en pilotage quand la logistique prend le relais. L'autoclicker
   est **achetable** et c'est le premier objet du jeu. Cf. `05_mechanics §1-2`.
10. **Nombres en chiffres pleins, jamais d'exposant.** `10000000`, pas `1e7` ni `10⁷`. Toute notation
    scientifique est proscrite. Repli extrême autorisé = mots français pleins, jamais un exposant.
    Cf. `architecture §6`, `05_mechanics §4`.
11. **Toute valeur visuelle passe par un design token** (variable CSS, commutée par `data-theme`).
    **Aucune couleur/typo littérale** dans un composant (`slate-700` interdit). Cf. `architecture §9`,
    `04_art_direction §3`. Défaut : thème « instrument scientifique ».
12. **Révélation progressive, jamais de grisé du futur.** Un élément non débloqué est **absent**, pas
    grisé ; il *apparaît* à temps. Pas de sur-explication (descriptions/tooltips imposés). Densité
    d'écran minimale et constante. Cf. `game-design §8.2`, `04_art_direction §5`.
13. **Culling à chaque transition de tier.** Entrer dans un tier retire/replie les éléments du tier
    précédent (absorbé/replié/remplacé), via une règle centralisée. Jamais un mur de boutons hérités.
    Cf. `content §collapse`.
14. **La direction artistique & l'UX sont un pilier**, pas du polish de fin. Une UI générique « site
    vibe-codé » est un bug. Cf. `04_art_direction`.

## Architecture (carte rapide — détail dans `architecture`)

```
core/   loop, time (offline), rng (seedé, pour le roguelite futur)
state/  store (Zustand), save (autosave/export), schema (version + migrations)
model/  types, formulas, engine (un tick), tiers (logique Kardashev)
data/   constants (physique), tiers/generators/upgrades/techs (contenu)
format/ notation (Decimal → CHIFFRES PLEINS, jamais d'exposant), unités (W, hab.)
theme/  tokens.css (data-theme), ThemeProvider
minigames/ registry + un module par tier (monté/démonté à la transition)
ui/     ResourceBar, GeneratorList (achat ×1/×10/×100), TechTree, ClickTarget, PhaseView, Discoverable
```

## Commandes (une fois scaffoldé)

```bash
npm run dev        # serveur de dev Vite
npm run build      # build de prod
npm run preview    # prévisualiser le build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

Après toute modif non triviale : `npm run typecheck` doit passer. TS est en mode strict.

## Conventions de code

- TS strict, pas de `any` implicite. Typer via les interfaces de `model/types.ts`.
- Identifiants, noms de fichiers et de composants en anglais ; commentaires/prose en français OK.
- Composants React purs côté rendu ; toute mutation d'état passe par les actions du store.
- Pas d'effet de bord de jeu dans les composants — seul `engine.ts` fait avancer l'état.

## Sauvegarde (discipline stricte)

- `Decimal` sérialisé en string (`.toString()`), revivifié via `new Decimal(str)`.
- Save **versionnée** (`schema.ts`) avec migrations : une save existante doit survivre aux updates.
- Hors-ligne : `elapsed = now − lastSaved`, **plafonné** (ex. 8 h), rejoué via `engine.ts`.

## Périmètre — ne PAS construire les features différées sans demande explicite

- **V1** : boucle Population/Énergie/Savoir (logistique) + clic stratégique + Tiers 0 → I →
  transition Dyson/II + sauvegarde/offline/export + une vraie fin provisoire.
- **Différé (architecturé, pas implémenté)** : Tier II complet → III → endgame entropie ; **couche
  roguelite** (runs, variance, choix exclusifs) ; codex ; achievements. Garder l'archi prête (RNG
  seedé, `exclusiveGroup` sur les techs) mais ne rien coder de tout ça tant que ce n'est pas demandé.

## Chantier en cours — écart plans ↔ code (à implémenter)

Les docs sont **en avance sur le code** scaffoldé. Deltas connus à appliquer (next build) :

1. **Départ à 0.** `store.initialState` met `population = POP_NEOLITHIC` → mettre **0**. `engine.step`
   doit ajouter le **terme additif d'amorçage** `A` (clics + autoclickers) à la logistique, sinon
   P=0 ne croît jamais. Cf. `05_mechanics §1`.
2. **Autoclicker.** Ajouter `hunting_band` en data (générateur produisant `population`), 1er objet.
3. **Clic à deux régimes.** `bootstrap` (crée de la pop) → `drive` (allocation) selon un seuil de pop.
4. **Notation pleine.** Réécrire `format/notation.ts` en chiffres pleins ; supprimer `scientific()` et
   le réglage `notation: 'scientific'|'named'`. Cf. `architecture §6`, `05_mechanics §4`.
5. **Thèmes/tokens.** Introduire `theme/tokens.css` + `data-theme` ; **purger toutes les couleurs
   littérales** des composants (slate/violet…). Défaut « instrument ». Cf. `04_art_direction`.
6. **Révélation progressive.** Composant `Discoverable`, état `discovered`, **retirer tout grisé** et
   toute sur-explication. Cf. `04_art_direction §5`.
7. **Achat ×1/×10/×100.** `buyQuantity` + coût de lot (somme géométrique) dans `formulas.ts`.
8. **Culling de phase.** Règle centralisée repliant les éléments de tier < tier courant. Cf. `content §collapse`.
9. **Mini-jeux.** Dossier `minigames/` + registry par tier ; livrer amorçage (T0), mix énergétique
   (TI), chantier orbital (Dyson) en v1.

Chaque delta touchant l'état → **migration de save** (`schema.ts`). Refaire la refonte visuelle/UX
(5-6) **avant** d'empiler du contenu : elle change la structure des composants.

## Workflow pour l'agent

- Avant d'ajouter du contenu : vérifier qu'il existe une interface adaptée. Sinon, étendre l'enum
  `Effect` (et le gérer dans `formulas.ts`) **une seule fois**, puis ajouter les données.
- Garder tous les chiffres d'équilibrage regroupés et facilement éditables (constantes nommées).
- L'**équilibrage** (costGrowth, seuils, rythme des transitions) se valide manette en main : drafter
  des valeurs raisonnables, viser une courbe en S par tier (montée → plateau → déblocage), et
  signaler que le tuning fin est du playtest, pas une vérité figée.
- Si une demande contredit une règle non négociable ou le périmètre v1, le **signaler** avant d'exécuter.

## Pièges connus

- **break_infinity** : utiliser les méthodes (`.add`, `.sub`, `.mul`, `.div`, `.pow`, `.gte`, `.lt`…),
  jamais les opérateurs JS (`+ - * / > <`) sur des `Decimal`. Ne jamais mélanger silencieusement
  arithmétique native et `Decimal`. Comparer avec `.gte/.lte`, pas `>=`.
- **Perf React** : ne pas abonner un composant à tout le store ; sélectionner des slices fines.
  Les ticks rapides ne doivent pas déclencher de re-render global.
- **Offline** : toujours plafonner le temps écoulé, sinon une longue absence fait exploser la boucle.
- **Notation** : chiffres pleins uniquement ; au-delà de ~1e21, `Number` ment, reconstruire la chaîne
  entière depuis mantisse+exposant dans `format/notation.ts`. Jamais d'exposant à l'écran.
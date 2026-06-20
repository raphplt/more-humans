# More Humans — Phases & contenu

Ce doc décrit le contenu tier par tier. **Tier 0 et Tier I sont détaillés comme gabarits** ;
les suivants sont esquissés avec la même structure, à étendre en suivant le modèle. Le contenu
est du **data** (cf. interfaces dans `architecture`) : étendre = ajouter des entrées.

---

## 1. Constantes physiques (≈, suffisant pour le jeu, ancrage réel)

Ces valeurs servent de **portes de phase et de flavor**, jamais de cours. À placer dans
`data/constants.ts`.

| Repère | Valeur ≈ | Usage en jeu |
|---|---|---|
| **Population de départ** | **0 hab.** | Le jeu démarre vide ; le clic crée les premiers Humains (amorçage) |
| Population néolithique (~10 000 av. J.-C.) | 5 × 10⁶ hab. | Premier repère atteint après l'amorçage |
| Population actuelle | 8 × 10⁹ hab. | Repère mi-Tier I |
| Puissance harnachée par l'humanité aujourd'hui | 2 × 10¹³ W (~18 TW) | On démarre Type ~0.7 |
| **Kardashev Type I** (planétaire) | ~10¹⁶ W | Porte fin Tier I |
| Énergie solaire reçue par la Terre | 1.7 × 10¹⁷ W | Plafond planétaire |
| **Kardashev Type II** (stellaire) | ~3.8 × 10²⁶ W | Luminosité du Soleil = porte Tier II |
| **Kardashev Type III** (galactique) | ~4 × 10³⁷ W | ~10¹¹ étoiles = porte Tier III |
| Étoiles dans la Voie lactée | 1–4 × 10¹¹ | Échelle d'expansion galactique |
| Masse du Soleil / de la Terre | 2 × 10³⁰ / 6 × 10²⁴ kg | Budget matière (méga-structures) |
| **Limite de Landauer** (effacer 1 bit à 300 K) | 2.85 × 10⁻²¹ J | Plafond de calcul → population post-bio |
| **Borne de Bekenstein** | info max dans une région d'espace | Plafond absolu = fin de partie |
| **Mort thermique** | ~10¹⁰⁰ ans | Horloge ultime de l'endgame |

> Astuce d'ancrage : afficher l'énergie en W **avec le type Kardashev fractionnaire**
> (formule de Sagan : `K = (log₁₀ P − 6) / 10`). Voir le joueur passer "Type 0.73 → 1.00 → 2.00"
> est déjà une mécanique de progression lisible et juste.

---

## 2. Gabarit d'un tier

Pour chaque tier on définit : **thème · activité dominante · mécanique active / mini-jeu ·
générateurs · upgrades/techs · modèle de capacité · goulot qui force la suite · ce qui est retiré
en entrant (culling) · flavor codex (optionnel)**.

> **Deux nouveaux champs par tier (cf. game-design §5, §9) :**
> - **Mécanique active / mini-jeu :** le système manuel propre au tier (cf. `05_mechanics §3`).
>   Il *remplace* celui du tier précédent.
> - **Culling :** ce que le tier précédent retire ou replie en arrivant ici (générateurs absorbés,
>   leviers résumés). Objectif : densité d'écran constante, jamais un mur de boutons hérités.

---

## 3. Tier 0 — L'Aube (néolithique → industriel) **[DÉTAILLÉ]**

- **Thème :** l'humanité s'installe et apprend à exploiter l'énergie terrestre.
- **Activité dominante :** **amorcer** la population (de 0 vers la masse critique) puis la faire
  croître, et débloquer les premières sources d'énergie.
- **Amorçage (le tout début, P = 0) :** le clic *crée des Humains* (régime amorçage, cf.
  `05_mechanics §1`). Le premier objet achetable est l'**autoclicker** (`hunting_band` /
  « bande de chasseurs-cueilleurs ») qui automatise ces naissances. Au-delà d'un seuil de pop, la
  **croissance logistique** s'enclenche et le clic bascule en régime pilotage.
- **Mécanique active / mini-jeu :** l'amorçage lui-même EST le mini-jeu du tier 0 — un geste
  tangible et bref, conçu pour être automatisé vite (pas de spam long). Voir `05_mechanics §3`.
- **Capacité de charge :** `capacity = base · f(énergie, techs agricoles)`. Au début, la nourriture
  (énergie biologique/agricole) plafonne tout.
- **Énergie :** de la combustion du bois aux fossiles. Faibles valeurs (10⁴ → 10¹³ W).

**Générateurs (data) — exemples :**
- `hunting_band` — **autoclicker de départ** : produit de la population/s (automatise l'amorçage),
  coût croissant. C'est le tout premier achat du jeu.
- `farmland` — produit de la capacité (nourriture) ; coût en population (main-d'œuvre) + savoir.
- `woodfire` / `watermill` / `coal_plant` — produisent de l'**énergie** (W), coût croissant.
- `scholars` — convertit une fraction de population en **savoir**/s.

> Achat **×1 / ×10 / ×100** (cf. `architecture §8`) : ×1 d'emblée, ×10 et ×100 *apparaissent* plus
> tard (jamais grisés). La somme géométrique du lot est calculée d'un coup dans `formulas.ts`.

**Techs (mini-arbre) — exemples :**
- `agriculture` → relève fortement la capacité (effect `raiseCapacity`).
- `writing` → multiplie la production de savoir.
- `metallurgy` → débloque de meilleurs générateurs d'énergie.
- `steam_engine` → grand saut d'énergie ; ouvre la voie au Tier I.

**Clic (Tier 0) :** deux régimes. D'abord **amorçage** (le clic crée des Humains, P part de 0),
puis **pilotage** ("étincelle d'ingéniosité") une fois la logistique lancée — la poussée allouée
accélère la croissance, la recherche, ou la construction selon le goulot choisi.

**Goulot → Tier I :** la population sature la capacité agricole/énergétique de la civilisation
préindustrielle. Il faut industrialiser (énergie massive) pour aller plus loin.

**Culling en entrant au Tier I :** `hunting_band`, `woodfire`, `watermill` deviennent dérisoires et
sont **repliés** (absorbés dans un résumé « ère préindustrielle », retirés de la liste active).
L'écran du Tier I ne montre plus les leviers néolithiques.

**Codex (optionnel) :** courte note sur la révolution néolithique, la transition agricole.

---

## 4. Tier I — Planétaire (industriel → Type I) **[DÉTAILLÉ]**

- **Thème :** saturer l'énergie disponible sur Terre. Objectif : ~10¹⁶ W (Type I).
- **Activité dominante :** scaler l'énergie (fossile → nucléaire → renouvelable massif → fusion),
  optimiser le rendement, **premiers pas vers l'espace** en fin de tier.
- **Nouveau système (transformation de phase) :** un **réseau/grille énergétique** où le *mix*
  compte — différentes sources avec rendement, plafond et synergies (sans micro-management : une
  poignée de leviers d'allocation, pas une usine). C'est le "structurel" sans la grille fiddle.
- **Mécanique active / mini-jeu :** **arbitrage du mix énergétique** — quelques curseurs/leviers
  d'allocation entre sources (fossile/nucléaire/renouvelable), chacun avec rendement et plafond ;
  optimiser le mix face au goulot courant. Design dans `05_mechanics §3`.
- **Culling :** le mini-jeu d'amorçage du Tier 0 a disparu ; les générateurs préindustriels sont
  repliés. On ne garde que les leviers énergétiques modernes.
- **Capacité de charge :** désormais dominée par l'**énergie** (`capacity ∝ énergie · efficacité`),
  plus par la nourriture.

**Générateurs — exemples :** `oil_plant`, `fission_reactor`, `solar_array`, `wind_farm`,
`fusion_reactor` (fin de tier, énorme).

**Techs — exemples :** `electrification`, `grid_optimization` (multiplie l'efficacité globale),
`renewables`, `fusion` (porte vers la fin du tier), `rocketry` (débloque l'espace → transition II).

**Goulot → transition :** **le mur planétaire.** L'énergie solaire reçue par la Terre (~1.7×10¹⁷ W)
plafonne tout. Impossible d'aller plus loin en restant au sol → il faut capter l'énergie de l'étoile.

**Codex :** échelle de Kardashev, pourquoi une planète plafonne.

---

## 5. Transition I → II — Système solaire **[ESQUISSÉ]**

- **Thème :** sortir de la Terre, capter l'énergie du Soleil.
- **Méga-projet central :** l'**essaim de Dyson** — construit par paliers (collecteurs orbitaux),
  chaque palier débloque un cran d'énergie vers 3.8×10²⁶ W (Type II). Iconique, lisible, satisfaisant.
- **Mécanique active / mini-jeu :** le **chantier orbital** — séquencer/allouer la construction de
  l'essaim (matière des astéroïdes → collecteurs → palier d'énergie), avec un arbitrage matière/temps.
  C'est le mini-jeu de la transition. Design dans `05_mechanics §3`.
- **Culling :** l'arbitrage du mix énergétique terrestre (Tier I) est replié — l'énergie planétaire
  devient une rente de fond, l'attention passe au chantier orbital.
- **Nouveau système :** construction orbitale + habitats spatiaux (la population vit désormais
  hors-sol, nouvelle source de capacité).
- **Générateurs :** `orbital_collector`, `space_habitat`, `asteroid_mining` (matière pour l'essaim).
- **Goulot → Tier II :** une seule étoile a une production finie ; et l'expansion biologique devient
  trop lente pour viser d'autres étoiles.

---

## 6. Tier II — Stellaire & virage post-biologique **[ESQUISSÉ]**

- **Thème :** civilisation à l'échelle d'une étoile, puis essaimage interstellaire.
- **Transformation de phase :** **virage transhumaniste mécaniquement motivé** — uploads/copies/
  esprits numériques = façon bien plus efficace de produire de la Population (plus d'esprits par
  unité d'énergie). *On compte toujours la population.* (Relabel cosmétique éventuel = module
  désactivable, cf. `game-design §3.4`.)
- **Nouveau système :** **sondes de von Neumann** auto-réplicantes pour semer d'autres systèmes.
- **Générateurs :** `mind_substrate` (calcul → esprits), `von_neumann_probe`, `star_lifting`.
- **Goulot → III :** la **vitesse de la lumière** — les systèmes distants sont quasi autonomes,
  latence réelle ; l'expansion devient un problème de propagation, pas de production locale.

---

## 7. Transition II → III & Endgame — Galactique **[ESQUISSÉ]**

- **Thème :** se répandre dans la galaxie (~10¹¹ étoiles, ~4×10³⁷ W = Type III).
- **Contrainte maîtresse :** lightspeed (colonies semi-autonomes, fronts d'expansion).
- **Plafonds physiques réels = mécaniques de fin :**
  - **Limite de Landauer** : combien de pensée (esprits) par unité d'énergie → refroidir près du zéro
    absolu, calcul réversible, pour repousser le mur.
  - **Borne de Bekenstein** : plafond absolu d'information dans une région d'espace = le **mur final**.
  - **Mort thermique** : l'horloge. L'endgame = **racer l'entropie**, maximiser la population avant
    que l'univers ne refroidisse. Vraie fin, climax façon Paperclips.

---

## 7bis. Culling & densité d'écran (mécanisme transversal) {#collapse}

Règle d'équilibrage et d'UX appliquée à **chaque transition de tier** (cf. game-design §5).

- **Principe :** entrer dans un tier **retire ou replie** les éléments du tier précédent devenus
  dérisoires. On ne laisse jamais s'accumuler 40 boutons hérités. À tout instant : une poignée de
  leviers pertinents *maintenant*.
- **Trois sorts possibles pour un élément sortant :**
  1. **Absorbé** — sa production est résumée en une rente de fond (une ligne « ère préindustrielle :
     +X/s »), l'objet individuel disparaît de la liste active.
  2. **Replié** — déplacé dans un historique/codex consultable, hors de l'écran principal.
  3. **Remplacé** — son rôle est repris par un objet du nouveau tier (le mini-jeu d'avant → celui d'après).
- **Data-driven :** chaque `GeneratorDef`/mini-jeu déclare son tier ; un élément dont le tier est
  strictement inférieur au tier courant passe en état « cull-é » (absorbé/replié) selon une règle
  centralisée, **pas** au cas par cas dans l'UI. Garde la liste active bornée automatiquement.
- **Cohérence avec la révélation progressive :** le culling enlève le passé, la révélation introduit
  le futur. Ensemble, ils maintiennent une **densité d'écran constante** du début à la fin.

## 8. Principe d'extension

Pour ajouter du contenu : créer des entrées `GeneratorDef` / `UpgradeDef` / `TechDef` / `TierDef`
conformes aux interfaces, avec leurs `effects` déclaratifs et `unlock`. **Ne jamais** coder de
formule dans les données : tout passe par `model/formulas.ts`. Un nouveau type d'effet → étendre
l'enum `Effect` et le gérer dans les formules, une seule fois.

**Équilibrage (le vrai travail, manette en main) :** caler les `costGrowth`, les seuils d'énergie
et le rythme des transitions pour que chaque tier soit une courbe en S nette (montée → plateau →
déblocage), sans mur de grind ni trivialité. L'IA drafte les chiffres ; le *feeling* se trouve en
jouant des dizaines de parties.
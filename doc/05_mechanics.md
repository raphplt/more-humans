# More Humans — Mécaniques (clic, autoclicker, mini-jeux, achat, équilibrage)

> Détail des mécaniques nouvelles/révisées. Les chiffres sont des **drafts** d'équilibrage à caler
> en playtest (cf. `content §8`). Le contrat de données et les règles non négociables restent ceux
> de `architecture` et `claude.md`.

---

## 1. Départ à 0 & clic d'amorçage

### 1.1 Le problème, et pourquoi c'est voulu

La population démarre à **0**. Or la croissance logistique `dP/dt = r·P·(1 − P/Cap)` est **nulle
quand P = 0** : rien ne peut s'amorcer tout seul. C'est le cœur du tout début : le joueur **crée
les premiers Humains à la main**. C'est le moment le plus tangible du jeu — chaque clic = des vies.

### 1.2 Le terme additif d'amorçage (changement de moteur)

La production de population devient **additive + logistique** :

```
dP/dt = A + r · P · (1 − P/Cap)
```

- `A` = **apport d'amorçage** = (population créée par les clics récents) + (population/s des
  autoclickers). C'est ce qui rend `dP/dt > 0` quand `P = 0`.
- Le clic en régime amorçage ajoute directement `clickPower` Humains (draft : 1 par clic au tout
  début, amélioré ensuite).
- À mesure que `P` grandit, le terme logistique domine `A` et prend le relais : la courbe en S
  s'installe, `A` devient négligeable. **On n'oblige jamais à spammer longtemps** : l'autoclicker
  (§2) automatise `A` très tôt.

Implémentation : `engine.ts` calcule `nextPop = pop + (A + logistic) · dt` (en `Decimal`), borné par
`Cap` en douceur. `A` agrège l'accumulateur de clics (qui retombe) et la prod des autoclickers.

### 1.3 Bascule amorçage → pilotage

Un **régime** dérivé de l'état, pas un nouveau champ figé :

```
regime = pop.gte(BOOTSTRAP_DONE) ? 'drive' : 'bootstrap'   // BOOTSTRAP_DONE ≈ quelques centaines (draft)
```

- **`bootstrap`** : le clic crée de la pop (`+clickPower`). L'UI montre un geste « peupler ».
- **`drive`** : le clic redevient l'action stratégique (accélérant `drive` alloué au goulot, cf.
  `game-design §4`). Il ne crée plus de pop. L'UI bascule en sélecteur d'allocation.

La transition est **lisible et mise en scène** (le bouton change de nature, micro-transition). Une
fois en `drive`, on n'y revient pas (monotone, pas de clignotement).

---

## 2. L'autoclicker

- **Achetable, pas gratuit.** C'est le **premier objet du jeu** : `hunting_band` (bande de
  chasseurs-cueilleurs) au tier 0, qui produit de la **population/s** (automatise l'amorçage).
- Modélisé comme un **`GeneratorDef`** qui `produces: { population: … }` — il alimente le terme `A`.
  Pas besoin d'un système séparé : c'est un générateur de population.
- **Montée en puissance :** coût croissant (`costGrowth`), achetable en ×1/×10/×100 (§ achat).
  Des upgrades/techs le multiplient. En fin de tier 0 il est trivialisé puis **cull-é** (replié)
  quand la logistique et les tiers suivants prennent le dessus (cf. `content §collapse`).
- **Champ d'état :** simple — un générateur de plus dans `owned` (ou `autoclickers` si on veut les
  distinguer pour l'UI ; cf. `architecture §4`). Garder ça minimal.

> Conséquence design : la **première boucle de récompense** du jeu est « je clique pour faire des
> humains → j'ai assez pour acheter l'autoclicker → ça clique pour moi → je peux respirer et investir
> ailleurs ». C'est l'accroche.

---

## 3. Mini-jeux / mécaniques actives par phase

Chaque tier offre **une vraie mécanique active**, dans l'esprit des temps forts de Paperclips
(marché, drones, course à la sonde) **sans les copier**. Une seule à la fois ; elle **remplace**
la précédente (culling). Architecture : modules isolés (`minigames/`, cf. `architecture §11`),
communiquant par effets déclaratifs, jamais en touchant l'`engine`.

| Tier | Mécanique active | Décision réelle du joueur | Remplace |
|---|---|---|---|
| 0 — Aube | **Amorçage** : créer/automatiser les premiers Humains | quand passer du clic à l'investissement (autoclicker, fermes) | — |
| I — Planétaire | **Mix énergétique** : quelques leviers d'allocation entre sources (fossile/nucléaire/renouvelable), chacun rendement+plafond | quel mix optimise le goulot courant sous contrainte de plafond | amorçage |
| Transition Dyson | **Chantier orbital** : séquencer la construction de l'essaim (matière → collecteurs → palier d'énergie) | où allouer matière/temps entre collecteurs et habitats | mix énergétique |
| II — Stellaire | **Essaimage von Neumann** : lancer/régler des sondes auto-réplicantes (taux de réplication vs rendement) | équilibre réplication/exploitation | chantier orbital |
| III — Galactique/Endgame | **Front d'expansion** contraint par la vitesse de la lumière ; **course à l'entropie** | où pousser le front, quand basculer en calcul réversible | essaimage |

Principes de design communs (pour que ce soient de **vrais** mini-jeux, pas du flavor) :

- **Une décision, pas du micro-management.** Une poignée de leviers signifiants, jamais une usine à
  régler. (Cf. la « grille sans fiddle » de `content §4`.)
- **Ancré dans la physique du tier.** La contrainte vient du réel (plafond solaire, vitesse de la
  lumière, Landauer), pas d'une règle arbitraire.
- **Lisible en quelques secondes, profond à optimiser.** Le joueur comprend l'objet sans tutoriel
  (révélation progressive), mais l'optimum demande de la réflexion.
- **Actif récompensé, jamais obligatoire.** L'idle tourne sans ; bien jouer le mini-jeu accélère.
- **Modulaire & désactivable.** Un mini-jeu = un module monté/démonté à la transition. Si un design
  déçoit en playtest, on le remplace sans toucher au cœur.

> v1 : livrer **réellement** l'amorçage (tier 0), le mix énergétique (tier I) et le chantier orbital
> (transition Dyson). Les suivants sont esquissés/architecturés (cf. périmètre v1).

---

## 4. Notation : chiffres pleins, jamais d'exposant

Règle (cf. `architecture §6`) : afficher **le nombre entier complet** (`10000000`), **jamais**
`1e7`, `10⁷`, ni notation nommée par défaut.

- **Séparateurs de milliers fins** pour la lisibilité (`10 000 000`). Police à **chiffres
  tabulaires** pour éviter le tremblement des compteurs.
- **Construction de la chaîne** (sans repasser par `Number`, qui ment au-delà de ~1e21) : à partir
  du `Decimal`, reconstruire la chaîne décimale entière depuis mantisse + exposant, padder de zéros,
  insérer les séparateurs. Les chiffres de poids très faible au-delà de la précision sont du bruit :
  les afficher comme `0` est acceptable (le joueur veut l'**ordre de grandeur plein**, pas la
  précision au bit).
- **Repli unique autorisé aux échelles extrêmes** (endgame, quand la chaîne devient ingérable —
  seuil draft ~16+ chiffres) : **mots français pleins** (« 100 milliards », « 2 billions »,
  « 4 trilliards »…), **jamais** un exposant. Réglable ; le défaut reste le chiffre brut tant que
  c'est raisonnable.
- **Énergie** : même règle, suffixe `W`, avec le **type Kardashev fractionnaire** (Sagan) affiché à
  côté comme repère de progression (ex. `Type 0.73`).
- **Nettoyage :** retirer l'ancien réglage `notation: 'scientific' | 'named'` et la fonction
  `scientific()` ; `format()` ne produit plus que du plein. Bumper la version de save.

---

## 5. Achat groupé & équilibrage

### 5.1 Achat ×1 / ×10 / ×100

- Sélecteur global `buyQuantity ∈ {1, 10, 100}`. **×1** d'emblée ; **×10** et **×100** *apparaissent*
  (révélation progressive, jamais grisés) après un seuil d'achats ou de tier (draft : ×10 après ~25
  unités cumulées ou tier I ; ×100 après ~tier II ou un volume plus haut).
- **Coût d'un lot de N** = somme géométrique, calculée **d'un coup** dans `formulas.ts` (ne jamais
  boucler N achats) :

  ```
  coût(owned, N) = base · g^owned · (g^N − 1) / (g − 1)     // g = costGrowth
  ```

- Achat **atomique** : autorisé seulement si le lot entier est payable (pas d'achat partiel) —
  reste lisible. (« max abordable » = extension future, garder la signature ouverte.)

### 5.2 Équilibrage & culling

- **Courbe en S par tier** (montée → plateau → déblocage), sans mur de grind ni trivialité. Caler
  `costGrowth`, seuils d'énergie, rythme des transitions manette en main.
- **Culling à chaque transition** (cf. `content §collapse`) : un élément de tier strictement
  inférieur au tier courant passe « cull-é » (absorbé en rente de fond / replié / remplacé), via une
  règle **centralisée** — pas au cas par cas dans l'UI. Garde la liste active et la charge cognitive
  bornées du début à la fin.
- **Densité constante** = culling (enlève le passé) + révélation progressive (introduit le futur).
  C'est l'invariant d'équilibrage le plus important pour le game-feel.

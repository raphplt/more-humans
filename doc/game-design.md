# More Humans — Game Design

> **À l'IA qui construit ce projet :** lis les docs dans l'ordre `game-design` →
> `architecture` → `content` → `04_art_direction` → `05_mechanics`. Le design est
> *principiel + exemples* : respecte les piliers et le contrat de données, mais tu as la
> liberté d'implémenter et d'équilibrer les chiffres. Le moteur est **data-driven** : ajouter
> du contenu = ajouter des entrées de données conformes aux interfaces, jamais réécrire la logique.
>
> **More Humans est un projet artistique autant qu'un jeu.** La direction artistique et l'UX ne
> sont pas du polish de fin : ce sont des piliers (cf. §8 et le doc `04_art_direction`). Une UI
> générique « site vibe-codé » est un bug, pas un point de départ acceptable.

---

## 1. Pitch

Un incrémental web où tu pilotes l'humanité de l'aube de la civilisation jusqu'aux limites
physiques de l'univers, le long de l'**échelle de Kardashev**. Simple à appréhender, profond
à maîtriser, ancré dans la physique réelle — sans jamais en faire un cours.

Référence d'esprit : Universal Paperclips (arc + transformation de phase + vraie fin) et
Cookie Clicker (boucle de croissance satisfaisante), mais avec une métrique chargée de sens
et une colonne vertébrale scientifique.

## 2. Piliers (non négociables)

1. **Zéro barrière.** Compréhensible en quelques secondes, jouable au clic, dans le navigateur.
2. **Profondeur sous la simplicité.** Facile à saisir, dur à maîtriser. La profondeur vient des
   décisions (où placer le clic, quoi rechercher, quel goulot débloquer), pas de la complexité de surface.
3. **Pas d'ennui.** Chaque palier Kardashev *transforme* l'activité dominante. On ne répète jamais
   longtemps la même action. La répétitivité est cassée par la transformation de phase.
4. **Respect du joueur.** Aucun dark pattern, aucune fausse difficulté, progression hors-ligne pour
   respecter son temps. L'actif est récompensé, jamais obligatoire.
5. **Ancrage physique = mécanique.** La science n'est pas du texte, c'est une *contrainte*. Le joueur
   la ressent (on ne dépasse pas l'énergie d'une étoile sans sphère de Dyson) sans lire d'essai.

## 3. La métrique (LE point structurant)

### 3.1 Une seule métrique spine, jamais relabellisée : la Population

Le nombre que le joueur maximise est la **Population (l'humanité)**, du début à la fin.
C'est l'équivalent du trombone de Paperclips. **Le jeu démarre à 0 humain** et monte jusqu'à
~10²⁰⁺ (galactique). **Le nom de l'unité ne change jamais.** C'est ce qui garde le jeu lisible
malgré les changements d'échelle, et ça répond à la crainte légitime du joueur désorienté par une
métrique mouvante.

> **Départ à 0 — conséquence mécanique (important).** La croissance logistique
> `dP/dt = r·P·(1−P/Cap)` est *nulle quand P = 0* : un jeu qui démarre à 0 ne peut pas s'amorcer
> tout seul par l'idle. C'est **voulu** : le tout début est une phase d'**amorçage manuel** où le
> clic (puis l'autoclicker acheté) fait apparaître les premiers humains, un à un, jusqu'à atteindre
> une masse critique où la logistique prend le relais. Le clic *crée* littéralement les premiers
> Humains du jeu — c'est le moment le plus tangible de toute la partie. Détail dans `05_mechanics §1`.

### 3.1bis Affichage des nombres : chiffres pleins, jamais d'exposant

Les nombres s'affichent **en entier** (`10000000`, `8000000000`), jamais en notation scientifique
ni en puissances (`10⁷` est proscrit). Séparateurs de milliers fins pour la lisibilité. La montée
en échelle des chiffres bruts *fait partie du sentiment de croissance* — voir les zéros s'accumuler
est une récompense. (Détail et gestion des très grandes échelles dans `05_mechanics §4`.)

### 3.2 L'énergie n'est pas le score — c'est le moteur et la porte

L'**Énergie (puissance harnachée, en watts)** est :
- l'axe de **Kardashev** (détermine ton tier),
- la **porte de phase** (chaque tier exige un palier d'énergie pour être franchi),
- le **moteur** de la croissance de population.

### 3.3 La boucle centrale

```
Énergie  →  relève la Capacité de charge
Capacité →  la Population croît vers elle (croissance LOGISTIQUE)
Population → produit du Savoir (une fraction "fait de la science")
Savoir   →  débloque + d'énergie, des multiplicateurs, et le palier suivant
```

Feedback positif **auto-limité** : la population monte en courbe en S puis plafonne à la capacité.
Ce plateau EST le goulot qui pousse au tier suivant. **Le pacing naît de la physique**, pas d'un
timer artificiel. Modèle suggéré : `dP/dt = r · P · (1 − P/Capacity)` (logistique), `Capacity`
fonction de l'énergie et des techs.

### 3.4 Le virage transhumaniste — méthode, pas métrique (et désactivable)

À partir du tier stellaire, l'expansion biologique est trop lente pour l'interstellaire. On débloque
la **population post-biologique** (uploads, copies, esprits numériques) : c'est juste une *façon
beaucoup plus efficace de produire de la Population* (plus d'esprits par unité d'énergie/espace).
**On continue de compter "la population/les esprits", on ne relabellise pas.**

> **Statut : fioriture isolée, désactivable.** Toute relabellisation cosmétique tardive
> ("minds", "compute") doit vivre dans un module séparé, derrière un flag. Si la playtest
> montre que ça perturbe, on le coupe sans rien casser au cœur du jeu.

## 4. Le clic stratégique (axe validé)

Le clic a **deux vies** (cf. §4.1). Au **tout début** (P proche de 0), c'est **assumé un spam
`+1`** : on clique pour faire naître les premiers Humains, et c'est *satisfaisant* — c'est l'accroche
la plus tangible du jeu. Le garde-fou anti-RSI n'est pas « interdire le spam », c'est **le rendre
court** : l'autoclicker l'automatise très vite. Ensuite, et pour tout le reste de la partie, le clic
devient une **action de pilotage** qui reste pertinente à toutes les échelles parce qu'elle
**oriente/multiplie le moteur idle** (là, plus de spam `+1`).

- Le clic produit un accélérant (provisoire) que le joueur **alloue sur le goulot courant** :
  booster la croissance, la recherche, ou la construction selon ce qui bloque *maintenant*.
- La décision = *où* appliquer la poussée, pas *combien de fois cliquer*.
- Lors de "fenêtres" clés (une découverte, un lancement orbital, l'allumage d'un réacteur), le clic
  actif donne un rendement surdimensionné — sans jamais devenir la source principale de production.

Principe : **l'idle produit, l'actif multiplie.** Jamais obligatoire, toujours récompensé.

### 4.1 La double nature du clic (amorçage → pilotage)

Le clic a **deux régimes**, séparés dans le temps, jamais simultanés :

1. **Amorçage (tout début, P proche de 0).** Le clic *crée directement de la Population* : chaque
   clic fait naître des Humains — **un vrai `+1` qu'on spamme**, et c'est voulu. C'est la seule
   fenêtre où un clic « produit », et c'est le geste le plus tangible du jeu (on peuple le monde de
   ses mains). Elle est **courte par design** : un **autoclicker** est achetable très tôt et
   automatise ce geste, puis la croissance logistique rend le clic d'amorçage obsolète. Le spam est
   donc *encouragé mais bref* — l'autoclicker, première récompense du jeu, libère le joueur dès qu'il
   en a assez.
2. **Pilotage (le reste de la partie).** Une fois la logistique lancée, le clic redevient l'action
   *stratégique* décrite ci-dessus : il oriente/multiplie le moteur idle, il ne produit plus de
   pop directement. La transition entre les deux régimes est mécanique et lisible (cf. `05_mechanics §1`).

### 4.2 L'autoclicker

Oui, il y a un autoclicker, et il est **achetable** (pas un upgrade gratuit). C'est le premier
objet du jeu : il automatise l'amorçage, puis devient un producteur de base que l'on améliore.
Son existence et sa montée en puissance sont détaillées dans `05_mechanics §2`.

## 5. Transformation de phase (axe validé à 100 %)

Chaque tier Kardashev introduit un **nouveau système** et en retire/transforme un ancien, forçant
le joueur à réapprendre le jeu optimal. C'est le moteur anti-ennui. Détail complet : `content.md`.

> **Culling de phase (règle d'équilibrage et d'UX).** Passer au tier suivant doit **retirer ou
> replier** les éléments du tier précédent — pas seulement empiler du contenu. Quand l'industrie
> rend les foyers néolithiques dérisoires, ces générateurs disparaissent (absorbés/résumés en une
> ligne), ils n'encombrent plus l'écran. L'objectif : à tout instant, le joueur voit ~une poignée
> de leviers pertinents *maintenant*, jamais un mur de 40 boutons hérités. Mécanisme dans
> `content.md §collapse` et `05_mechanics §5`.

Survol :

- **Tier 0 — Aube** (néolithique → industriel) : peupler la Terre, premières énergies.
- **Tier I — Planétaire** : saturer l'énergie terrestre ; le mur planétaire pousse vers l'espace.
- **Transition I→II — Système solaire** : la **sphère/essaim de Dyson** comme méga-projet central.
- **Tier II — Stellaire** : sondes de von Neumann, virage post-biologique motivé mécaniquement.
- **Transition II→III — Galactique** : expansion auto-réplicante, contrainte de la vitesse de la lumière.
- **Tier III — Endgame** : limites physiques réelles (Landauer, Bekenstein) et **mort thermique comme
  horloge ultime**. La fin = racer l'entropie. Vraie fin satisfaisante, façon Paperclips.

## 6. Anti-ennui / pacing

- Une activité dominante par tier, qui change au tier suivant.
- Progression hors-ligne (calcul à la reprise depuis le timestamp, plafonnée).
- Le clic + l'allocation donnent une couche active continue par-dessus l'idle.
- Pas de mur de grind : si un palier traîne, c'est un bug d'équilibrage, pas une "feature".

## 7. Périmètre

### V1 (objectif : shippable)
- Boucle centrale (Population/Énergie/Savoir) + croissance logistique.
- Clic stratégique.
- Tiers **0 → I → transition Dyson/II** entièrement jouables, avec leurs transformations de phase.
- Sauvegarde + progression hors-ligne + export/import.
- Une vraie fin (provisoire) au franchissement du tier II, le reste en "à venir".

### Plus tard (architecturé, pas implémenté en v1)
- Tier II complet → III → endgame entropie.
- **Couche roguelite** (runs, variance, choix exclusifs) — voir les pistes dans nos échanges :
  optimum *contextuel à la run* contre la méta dominante ; draft du départ + reroll coûteux +
  méta-progression rendant toute run productive, contre le reset-scumming.
- Codex scientifique optionnel (flavor déblocable par milestone, façon citations de Civilization).
- Achievements, notation/formatage avancé des grands nombres.

> Le moteur v1 doit être **data-driven** dès le départ pour que ces extensions = ajout de données
> et de modules, jamais une réécriture.

## 8. Direction artistique & UX (pilier, pas du polish)

More Humans est un **projet artistique**. La charte graphique, l'UX et le « level design » sont
traités au même niveau que la boucle de jeu. Spécification complète dans `04_art_direction.md` ;
principes structurants ici.

### 8.1 Charte graphique — épurée, minimaliste, commutable

Esthétique sobre et intentionnelle, pas un thème Tailwind par défaut. La direction par défaut est
**« instrument scientifique »** (lignes fines, palette très restreinte, esprit tableau de bord /
panneau de contrôle de l'humanité). Le jeu supporte **plusieurs chartes commutables** (instrument
scientifique, brutalisme typographique, minimalisme cosmique) via un **système de design tokens**
(variables CSS pilotées par `data-theme`), de sorte que changer de charte = changer un attribut, pas
réécrire des composants. Détail technique dans `architecture §theming`, spec visuelle dans `04_art_direction`.

### 8.2 Révélation progressive — montrer peu, dévoiler à temps (à la Paperclips)

**L'écran ne projette jamais tout au joueur.** L'histoire et les mécaniques se *comprennent* en
jouant, elles ne sont pas expliquées d'avance. Règles non négociables :

- **Pas de tout-explicite.** On retire les descriptions verbeuses, les tooltips redondants, les
  libellés qui sur-expliquent. Le sens vient de l'action et du contexte, pas d'un paragraphe.
- **Pas d'éléments grisés.** Un contenu non débloqué est **absent**, pas affiché en grisé. Il
  *apparaît* (avec une micro-transition) au moment où il devient pertinent. Le grisé révèle le futur
  et tue la surprise ; l'absence préserve la découverte.
- **Densité minimale.** À tout instant, l'écran montre la poignée d'éléments pertinents *maintenant*.
  Le reste est caché, replié, ou pas encore né (cf. culling de phase §5).
- **Référence :** Universal Paperclips, poussé à l'extrême — un écran nu au départ, des systèmes qui
  émergent un par un, une montée en complexité qui *se ressent* sans jamais être annoncée.

## 9. Mécaniques réelles & mini-jeux (profondeur active)

Au-delà de la boucle idle et du clic d'allocation, chaque phase doit offrir une **vraie mécanique
active** — un mini-système/mini-jeu propre au tier, dans l'esprit des moments forts de Paperclips
(marché, combat de drones, course à la sonde) **sans les recopier**. Objectif : une activité
manuelle qui demande une décision réelle, ancrée dans le thème physique du tier, et qui *remplace*
celle du tier précédent (culling). Exemples par tier détaillés dans `content.md` et `05_mechanics §3` :

- **Aube :** amorçage manuel de la population (clic créateur) → bascule logistique.
- **Planétaire :** arbitrage du **mix énergétique** (quelques leviers d'allocation, rendement/plafond).
- **Dyson/Stellaire :** chantier orbital par paliers (séquencer/allouer la construction de l'essaim).
- **Galactique/Endgame :** front d'expansion contraint par la vitesse de la lumière, course à l'entropie.

Ces mécaniques sont **data-driven et modulaires** : un mini-jeu = un module activé par tier, pas un
spaghetti dans le cœur. Architecture dans `architecture §minigames`.
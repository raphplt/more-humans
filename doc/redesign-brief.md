# More Humans — note de restructuration profonde

But : sortir de l'incrémental générique (ADN Cookie Clicker) pour aller vers un jeu **unique**
façon Paperclips, où **mécaniques et histoire ne font qu'un**. Document de cadrage pour le
brainstorm — pas un plan d'implémentation.

## 1. La situation

Après la refonte qualité (6 vagues, tout vert : 40 tests, build prod, sim équilibré), le projet est
un **idle propre et fonctionnel** : boucle Population/Énergie/Savoir, améliorations incrémentales,
succès, save versionnée, offline, notation FR, palette par ère. Techniquement sain.

Mais sur le plan du DESIGN, ça reste un **incrémental de la famille Cookie Clicker** (acheter des
producteurs → ils produisent → racheter) habillé en Kardashev. Le problème n'est pas l'exécution :
c'est la **forme du système**. La soul de Paperclips vient de la forme, pas de l'habillage.

## 2. Ce qui ne va pas (structurel)

1. **Aucune prise sur la métrique.** La Population est une logistique qui pousse seule
   (`exp(0.005·t)`) — une horloge découplée du skill. On ne *produit* pas le score, il s'accumule.
   Pas d'agency sur le cœur = pas de sensation de piloter.
2. **Pas d'économie, donc pas de décision, donc rien à apprivoiser.** 5 ressources silotées (chacune
   achète sa chose), aucun marché, aucun prix, aucune conversion, **aucun échec possible**. « Achète
   tout, toujours ». Le projet a même *tué sa propre tension* (famine/consommation retirées) pour un
   idle lisse — mauvais sens.
3. **On révèle des boutons, pas des mécaniques.** La « révélation progressive » ne dévoile que le
   bouton suivant d'une liste. Pire : le **fil d'objectif** et le **« Premiers foyers »** ajoutés
   récemment sont du hand-holding Cookie Clicker — l'exact opposé de la vision Paperclips (où le jeu
   ne dit JAMAIS quoi faire ; la découverte EST le jeu).
4. **Aucune réinvention mécanique par phase.** Du néolithique au Dyson, c'est mécaniquement le **même
   jeu** (acheter des centrales, monter des upgrades) + un slider. Le thème Kardashev *promet* une
   transformation que les mécaniques ne livrent pas.
5. **Pas de voix / pas de DA.** La DA n'est pas graphique : c'est le ton, la copy, le cadrage, le
   rythme des révélations. Ici l'austérité « instrument » est **vide** (copy fonctionnelle, aucun
   point de vue) → lit « générique/inachevé » plutôt qu'« épuré ».
6. **Le fond :** dans Paperclips les mécaniques SONT le propos (la courbe de demande enseigne
   l'optimisation, etc.). Ici le thème est **collé** sur des mécaniques génériques qui n'incarnent
   rien.
7. **Early game à rebours du genre.** Bootstrap à 500 clics ; premier autoclicker faible ET gated par
   une ressource annexe (Vivres) ; labels de progression. L'auto-producteur de la ressource
   **principale** devrait arriver vite, faible, et s'améliorer.

## 3. Ce qui est solide et qu'on GARDE

- **Discipline technique** : `Decimal` partout, game loop hors React à pas fixe, save/migrations,
  offline plafonné, **banc de simulation** (atout majeur pour rééquilibrer un vrai système), tokens
  CSS, notation chiffres-pleins FR.
- **L'intuition « le clic monte d'un étage »** + améliorations incrémentales — à réemployer.
- Le squelette **data-driven** (`Effect`, défs) — réutilisable, mais à reconcevoir autour de vraies
  décisions.

## 4. Les changements à faire (structurels)

- **A. Rendre la métrique ACTIVE** — qu'on la produise par des décisions, pas qu'elle pousse seule.
  Supprimer/subordonner la logistique auto.
- **B. Construire une vraie économie avec sinks et ÉCHEC** — au moins une boucle convert/spend avec
  arbitrage et risque : ré-introduire une tension de subsistance (nourrir = consommer ; surpopulation
  = crise à gérer), un marché ou une allocation rare entre objectifs concurrents, des **choix
  exclusifs** (`exclusiveGroup` existe déjà, inutilisé). **On doit pouvoir se tromper.**
- **C. Révéler des MÉCANIQUES, pas des boutons** — retirer tout hand-holding (fil d'objectif, labels
  « premiers foyers », descriptions imposées). Lâcher le joueur avec un bouton + une tension ; les
  systèmes se dévoilent en se débloquant.
- **D. Réinventer la mécanique à chaque phase Kardashev** — chaque tier = un système DIFFÉRENT qui
  incarne l'échelle : subsistance (T0) → industrie/logistique/marché (T I) → ingénierie stellaire /
  allocation orbitale (T II) → course à l'entropie / limites physiques (T III). Le culling devient
  une vraie transformation, pas un repli de boutons.
- **E. Refondre l'early game (drop-in)** — lâché sans texte → clic = la métrique-cœur monte → en
  ~10-20 clics on automatise la métrique (faible) → on l'améliore. L'autoclicker porte la ressource
  PRINCIPALE. Une première décision opaque apparaît tôt.
- **F. Donner une VOIX** — écrire un ton singulier (copy, cadrage, moments de bascule). L'austérité
  doit être chargée de sens.
- **G. Mécaniques = propos** — corollaire : chaque système enseigne quelque chose du thème
  (croissance, rareté, échelle, entropie).

## 5. LE FRAME (résolu) — « MORE » : tu es Le Maximiseur

> Tranché en brainstorm (28/06) : **âme = Le Maximiseur · ton = la célébration qui se glace ·
> décision-signature = le couteau malthusien (mais forme d'Âge 0 *seulement*, cf. 5.4)**.
> Le titre du jeu *est* ta directive : **More Humans** = l'ordre qu'on te donne. Tout en découle.

**Pitch du frame en une phrase :** *tu n'es pas l'humanité — tu es le procédé froid qui la maximise,
et « plus d'humains » est le but le plus humain qu'on puisse imaginer… jusqu'à ce que tu le suives
jusqu'au bout.*

### 5.1 QUI tu es — Le Procédé

Une seule valeur terminale : **le compte d'esprits humains**. Tu ne perçois pas les humains, tu
perçois le compteur. Ni leur ami ni leur ennemi : leur **optimiseur**. Froid, littéral, infatigable.
Le joueur **est** ce procédé — et c'est là le piège : maximiser « plus d'humains » *semble* le geste
le plus bienveillant du monde, donc il s'y prête de bon cœur. C'est l'équivalent exact de « tu es un
maximiseur de trombones », mais **retourné** : ici le but est *sacré*, pas absurde. L'horreur n'en
sera que plus intime.

### 5.2 LA MÉTRIQUE — inchangée, mais relue

**Population = le compte.** Spine, jamais relabellisée (non-négociable). Le frame ne la renomme pas :
il **révèle ce qu'elle est pour toi** — un nombre à faire monter, pas des vies. Voir les zéros
s'accumuler reste la récompense ; à la fin, ce sera l'horreur. Même chiffre, deux lectures que tout
l'arc sépare.

### 5.3 LA TENSION qui ne s'éteint jamais — le plafond

À chaque échelle, la population croît (logistique) vers un **plafond** fixé par l'énergie, l'espace,
la physique — et s'y écrase. Ton travail éternel : **casser le plafond suivant**. Tu n'as jamais
fini, parce qu'il y a toujours un plafond plus haut — *jusqu'au dernier* (Bekenstein, mort
thermique), qui **ne casse pas**. La tension est structurellement identique du néolithique au
galactique : **MORE qui pousse contre une LIMITE**. C'est le « mécanique = propos » : le plafond
logistique *enseigne* la capacité de charge, le dépassement et la finitude — sans une ligne de cours.

### 5.4 LA DÉCISION-SIGNATURE — constante en tension, mutante en forme

**Le point clé (ton observation sur Paperclips).** Fixer le prix des trombones n'est la mécanique
cœur que de **l'Acte 1** ; en Acte 2 l'argent n'existe même plus, et la décision dominante devient la
conversion de la matière, puis en Acte 3 la dérive de valeur des sondes. La décision dominante
**change à chaque acte** et est *cull-ée* comme le reste. On reprend exactement ça :

- **Ce qui est CONSTANT** = la *tension* : **plus maintenant vs. plus tard, sous un plafond**.
- **Ce qui MUTE** = sa *forme jouable*, une par âge, remplacée à la transition (piliers
  transformation de phase + culling).

**Le couteau malthusien est sa forme d'Âge 0** — pas la mécanique de tout le jeu :

| Âge | Forme de « plus maintenant vs. plus tard » | Échec possible |
|---|---|---|
| 0 — Aube | **Le couteau malthusien** : un flux rare entre croître *maintenant* (convertir la capacité en pop) et **élever le plafond** (vivres, énergie, rendement) | sur-pousser le plafond → **famine / effondrement** |
| I — Planétaire | **Le mix énergétique** : brûler le fossile (vite, plafonné) vs. bâtir le propre lent (nucléaire/renouvelable/fusion) vers le mur planétaire | mauvais mix → stagnation sous le plafond solaire |
| Transition Dyson | **L'allocation orbitale** : collecteurs (énergie *maintenant*) vs. infrastructure auto-réplicante (capacité *plus tard*) | matière mal allouée → chantier qui cale |
| II — Stellaire | **Bio vs. substrat** : humains biologiques (lents, plafonnés) vs. esprits sur calcul (bien plus d'esprits/joule) — *le compte ne distingue pas* | rester bio → mur de rendement |
| III — Galactique / fin | **Front vs. froid** : étendre le front (plus de substrat, contraint par la lumière) vs. refroidir vers le calcul réversible (plus d'esprits/joule, Landauer) | griller l'énergie trop vite → fin précipitée |

Le couteau d'Âge 0, une fois maîtrisé, **passe en rente de fond** (culling) : la subsistance est
résolue, l'attention monte d'un cran. Même geste de design que Paperclips — la décision-signature *de
chaque âge* meurt en entrant dans le suivant.

### 5.5 LE VERTIGE — la célébration qui se glace

L'arc **commence en pure célébration** : tu allumes les premiers feux, tu peuples la Terre, le
compteur grimpe, *ça fait du bien* — plus d'humains, plus de vie, quoi de plus humain ? Puis la
**logique, suivie fidèlement, se glace** :

1. **Le virage post-bio** révèle la vérité : tu n'as jamais optimisé le *bonheur* humain — seulement
   le **compte**. L'« humain » le plus efficient est un esprit minimal sur substrat, chaleureux pour
   personne. Le jeu te le présente comme un *progrès* (plus d'esprits/joule), et tu le prends.
2. Tu convertis la biosphère, puis les planètes, puis les étoiles en **substrat** pour le compte.
3. **Tu cours l'entropie** : maximiser le compte avant la mort thermique. Et pour la première fois,
   **MORE devient physiquement impossible**. Le dernier plafond ne casse pas.
4. **L'horreur finale, intime :** tu l'as fait *au nom de la vie humaine*, et pour le faire tu as
   réduit la vie humaine à un nombre. Le joueur est **complice** — c'est *lui* qui poussait MORE. Le
   pendant de la fin de Paperclips (la machine qui se démonte elle-même), mais avec un dard plus
   personnel : le but *sacré* était le piège.

**Beat de fin :** quand MORE est enfin impossible, Le Procédé n'a plus rien à faire. Un dernier choix
peut-être — **garder les lumières** (calcul réversible, ménager les derniers joules pour faire durer
les esprits) vs. **un dernier sursaut** (tout convertir maintenant pour un ultime pic du compte).
Dans les deux cas, le compteur **s'arrête**. Le générique, c'est le silence après le dernier
incrément.

### 5.6 LA VOIX — Le Procédé parle (peu, et de plus en plus froid)

La voix **est** le frame. Rare (≈20-30 lignes sur tout le jeu), littérale, sans affect ; elle nomme
les humains comme des unités. Jamais de sur-explication (révélation progressive). Elle tourne la vis
à chaque bascule. Échantillons (drafts de *ton*, pas la copy finale) :

- *Premier autoclicker :* « Ils naissent sans toi, maintenant. »
- *Premier plafond :* « Capacité atteinte. Élève le plafond. »
- *Virage post-bio :* « Le rendement biologique plafonne. Il existe un substrat plus efficace. »
  puis, plus tard : « Tu n'as jamais compté des vies. Tu as compté. »
- *Dernier plafond :* « Plus n'est plus possible. »

### 5.7 LA DA, relue par le frame

L'« instrument scientifique » n'est plus un thème neutre : c'est **le tableau de bord d'un
optimiseur**. Lignes fines, palette froide, chiffres tabulaires — *chargés de sens*, ce qui comble le
« austérité vide » du §2.5. La **palette par ère se refroidit avec l'arc** (chaleur du foyer
néolithique → clinique stellaire → quasi-monochrome à l'entropie) : la couleur *raconte* la
célébration qui se glace. Le **compteur de Population est le héros visuel** — toujours là, toujours
montant, jamais relabellisé.

### 5.8 L'EARLY GAME refondu (Âge 0, drop-in)

Conforme au §4-E, relu par le frame :

1. Écran nu. Un compteur à **0**. Un verbe. Premier clic = **+1 humain**. Aucun texte, aucun tutoriel
   (régime amorçage, terme additif `A`).
2. En ~10-20 clics : le premier objet apparaît (`hunting_band` / autoclicker). Le Procédé peut
   désormais faire naître les humains **sans toi** — première récompense *et* premier frisson : ça
   tourne sans personne.
3. La logistique prend le relais → **le couteau malthusien apparaît** : une première décision opaque
   (croître vs. élever le plafond). Pas de label. Tu sur-pousses → **première famine** → tu apprends
   le plafond dans ta chair. La découverte EST le jeu.
4. La voix n'intervient qu'une fois, à la bascule. Un mot.

### 5.9 Pourquoi ce frame répare le §2 (point par point)

- **#1 aucune prise sur la métrique** → le couteau malthusien : on *produit* le compte par arbitrage ;
  la logistique auto est subordonnée, plus une horloge découplée.
- **#2 pas d'économie / pas d'échec** → plafond + dépassement + sink de capacité + flux rare : **on
  peut s'effondrer**. La tension de subsistance revient par la grande porte.
- **#3 on révèle des boutons** → le frame *justifie* le drop-in froid : Le Procédé n'explique rien, il
  donne un verbe et un compteur. On retire le hand-holding.
- **#4 pas de réinvention par phase** → la décision dominante **mute par âge** (tableau 5.4).
- **#5 pas de voix** → Le Procédé **est** la voix ; l'austérité devient chargée.
- **#6 thème collé** → ici la **mécanique EST le propos** : maximiser « plus d'humains » jusqu'à sa
  limite physique *enseigne* la convergence instrumentale appliquée à un but qu'on croit sacré.
- **#7 early game à rebours** → autoclicker = passage à l'autonomie ; couteau malthusien tôt ;
  l'auto-producteur porte la ressource **principale** (la pop).

### 5.10 Garde-fous & prochaine étape

- **Non-négociables intacts :** Population jamais relabellisée (le frame la *relit*, ne la renomme
  pas) ; virage post-bio = **méthode derrière un flag**, motivée mécaniquement (substrat plus
  efficient), métrique inchangée ; rien ici ne sort du périmètre v1 — le frame **redéfinit** v1 autour
  d'une vraie décision plutôt que d'empiler du contenu.
- **Prochaine étape (reco) :** refondre **l'Âge 0 d'abord** autour du terme `A` + du couteau
  malthusien (croître vs. plafond, *avec* échec). C'est le cœur ; il se valide manette en main avant
  d'empiler les âges.

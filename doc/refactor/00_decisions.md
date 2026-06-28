# More Humans — Refacto · 00 · Décisions de design & glossaire (SOCLE)

> **Rôle de ce doc :** le socle du refacto. Tous les docs `01`–`06` **citent** ce fichier et
> emploient son glossaire à l'identique. Si une décision change ici, les docs en aval se mettent à
> jour, pas l'inverse.
> **Frame :** cf. `../redesign-brief.md §5` — *Le Maximiseur · la célébration qui se glace · le
> couteau malthusien = forme d'Âge 0*.
> **Statut :** tranché le 28/06. Les **chiffres** restent des drafts à caler en simulation.

---

## 1. Les forks tranchés

### D1 — Modèle d'échec : **recul dur, récupérable**

Sur-pousser le couteau (faire croître la population au-delà de la capacité soutenable) déclenche une
**famine** : la population **chute** (perte sèche du compte), puis se reconstruit une fois le plafond
relevé. **Pas de fin de partie** (il n'y a pas de runs en v1).

- *Pourquoi :* réintroduit une vraie tension de subsistance — **on peut se tromper** (brief §2.2) —
  sans importer le roguelite différé. L'échec doit **piquer et enseigner le plafond**, pas punir.
- *Impose à `01` :* modéliser une **consommation/upkeep** de la population et une **dynamique de
  chute** quand le soutenable est dépassé (pas un simple plafonnement).
- *Impose à `03` :* un test « une stratégie *tout-croissance* provoque une famine mesurable, puis une
  reprise est possible ».

### D2 — Ressource rare du couteau : **la main-d'œuvre**

On répartit l'**effort d'une fraction de la population** entre deux emplois :
**croître maintenant** (relancer les naissances / le terme de croissance) et **élever le plafond**
(défricher, outiller → capacité). C'est **auto-référentiel** : l'optimiseur **dépense des humains
pour faire des humains** — le cœur thématique du frame (les humains sont le substrat).

- *Impose à `01` :* une variable d'allocation **`L` (part de P)** ventilée Croissance/Capacité, qui
  pilote comment bougent le terme de croissance et la capacité `Cap`.
- *Note :* le **Savoir** reste la monnaie de **déblocage** (techs/multiplicateurs), **pas** le flux
  du couteau. Ne pas confondre les deux.

### D3 — Affordance : **un curseur d'allocation unique + le clic en surpoussée**

Un seul **curseur Croissance ↔ Capacité** (état idle **persistant**). Le **clic** devient une
**surpoussée temporaire** du côté favorisé par le curseur — *l'idle produit, l'actif multiplie*. Une
seule décision visible à l'écran, lisible en secondes, profonde à optimiser.

- *Cohérence :* matérialise le « clic = accélérant alloué au goulot » de `../05_mechanics.md §1`,
  sans micro-management (une décision, pas une usine à régler).
- *Impose à `02` :* le **verbe de l'Âge 0** = poser le curseur. Le **clic d'amorçage** (régime
  `bootstrap`, crée de la pop quand P≈0) **précède**, puis bascule en **surpoussée** (régime `drive`)
  quand la logistique prend le relais.

---

## 2. Acquis de périmètre (rappel — non rediscutés ici)

- **Runs / roguelite = différé** hors v1 : on **architecture** (RNG seedé, `exclusiveGroup`) mais on
  **ne code pas**. Cf. périmètre `../../claude.md`.
- **Explicite du virage post-bio = décidé plus tard** : ça concerne l'Âge II et **ne bloque pas**
  l'Âge 0.
- **Non-négociables intacts :** Population **jamais relabellisée** (le frame la *relit*, ne la
  renomme pas) ; post-bio = **méthode derrière un flag** ; `Decimal` partout ; game loop hors React à
  pas fixe.

---

## 3. Glossaire canonique (à employer tel quel dans `01`–`06`)

| Terme | Définition courte | Rôle |
|---|---|---|
| **Population (P)** | le compte d'esprits humains | la **métrique-spine** = le score, jamais relabellisée |
| **Énergie (E)** | puissance harnachée (W) | **moteur** + porte de Kardashev — *pas* le score |
| **Savoir (K)** | monnaie de déblocage (techs, multiplicateurs) | débloque ; **pas** le flux du couteau |
| **Capacité (Cap)** | plafond logistique courant de P | cible de la croissance ; f(E, techs, part « Capacité » de L) |
| **Main-d'œuvre (L)** | fraction de P allouée par le joueur | le **flux rare** du couteau malthusien (Âge 0) |
| **Couteau malthusien** | répartir L entre Croissance et Capacité, sous le plafond | la **décision-signature**, forme d'Âge 0 de « plus maintenant vs. plus tard » |
| **Amorçage (terme A)** | apport additif (clics + autoclicker) | rend `dP/dt > 0` quand P = 0 ; régime `bootstrap` |
| **Pilotage (`drive`)** | après la masse critique | le clic ne crée plus de pop : il **surpousse** le curseur |
| **Surpoussée** | boost temporaire du clic actif | du côté favorisé du curseur ; *l'actif multiplie* |
| **Famine / dépassement** | consommation > production soutenable (P > soutenable) | P **chute** — le modèle d'échec (D1) |
| **Culling** | repli/absorption des éléments d'un tier dépassé | densité d'écran constante |
| **Le Procédé** | l'optimiseur froid que le joueur incarne | le **POV** et la **voix** |

---

## 4. Ce que ce doc débloque

- **`01_economy.md`** : D1+D2 fixent les variables et la dynamique d'échec ; D3 fixe l'entrée joueur.
  → on peut écrire les équations.
- **`02_age0-slice.md`** : D3 fixe le verbe, D1 fixe le premier échec. → on peut scripter les 10
  premières minutes.

# More Humans — Refacto · 02 · Vertical slice de l'Âge 0

> **Rôle :** le **premier jouable** que l'IA construit en premier — assez pour **prouver le frame**
> manette en main. Emploie `00` (glossaire) et `01` (modèle). Objets = `data/*.data.ts` réels,
> ajustés au modèle `01`. Chiffres = **drafts** à caler au banc.
> **Portée :** l'**Âge 0 early** (le couteau malthusien, ~10-15 min). La **rampe industrielle**
> (énergie → porte Tier I) est esquissée en §8.

---

## 1. Ce que le slice doit prouver

Une session de ~10-15 min qui fait vivre, dans l'ordre, **toute la boucle du frame** :

```
clic = +1 Humain  →  automatisation (la bande)  →  le couteau (curseur)  →
PREMIÈRE FAMINE (la pop BAISSE)  →  maîtrise (anticiper le plafond)  →  l'horizon industriel
```

Si ces six beats se ressentent **sans une ligne de tutoriel**, le frame tient. Sinon, c'est un bug
de design, pas d'équilibrage.

---

## 2. Le verbe (UI concrète de l'Âge 0)

- **Drop-in (P=0) :** écran nu. Un **compteur** (Population, le héros visuel) et **une cible de
  clic**. Rien d'autre. Clic = `+clickPower` Humains. Aucun texte.
- **Le curseur (apparaît à P≈40) :** **un seul** curseur horizontal **Croissance ↔ Capacité** (état
  persistant = `allocation`). C'est *la* décision de l'Âge 0. Pas de second réglage à l'écran.
- **Le clic en `drive` :** une fois la logistique lancée, le clic devient une **surpoussée** « MORE »
  temporaire **du côté vers lequel le curseur penche** (`driveTarget` dérivé de la position). *L'idle
  produit, l'actif multiplie.* (Variante de tuning : le clic surpousse **toujours** Croissance — plus
  agressif, peut provoquer la famine ; à trancher au banc.)
- **Lisibilité :** à tout instant, ~une poignée d'éléments. Vivres affichées **uniquement** quand le
  tampon devient pertinent (≈ premier plafond) ; Savoir/Énergie quand ils apparaissent.

---

## 3. Les objets de l'Âge 0 early (le slice)

> Re-costés en **Vivres/Savoir** (la Matière sort de l'Âge 0 early, cf. `01 §10`). Effets =
> enum `Effect` existant ; `discover` = condition d'apparition (révélation).

| id | rôle dans le modèle `01` | coût (draft) | apparition (`discover`) |
|---|---|---|---|
| `hunting_band` | **autoclicker** → terme `A` (pop/s) | `food 80`, ×1.3 | `population ≥ 25` |
| `farmland` | **pas de capacité** : `raiseFoodCeiling` → `Fprod`↑ → `Cap_sustain`↑ | `food 300`, ×1.22 | après le 1ᵉʳ plafond (`population ≥ 60`) |
| `scholars` | `population → knowledge` (re-costé en Vivres) | `food 120`, ×1.2 | `population ≥ 80` |
| `agriculture` (tech) | `raiseCapacity ×2` (gros palier de `Cap_sustain`) | `knowledge 40` | `knowledge ≥ 15` |
| `crop_rotation` (upg) | `raiseCapacity` +4 %/niv | `knowledge 60`, ×1.8 | tech `agriculture` |
| `granary` (upg) | `multiplyProduction food` +10 %/niv (`Fprod`↑) | `knowledge 50`, ×1.7 | tech `agriculture` |

Changements de données impliqués (à appliquer) : `scholars.baseCost` `resources`→`food` ;
`farmland.effects` reste `raiseFoodCeiling` (interprété par `01` comme `+Fprod`) et **perd** l'auto-
reproduction gated (cf. `01 §8`) ; les upgrades `raiseCapacity` agissent sur `Cap_sustain`.

---

## 4. L'ordre de révélation (le rythme)

| Seuil | Apparaît | Pourquoi ce moment |
|---|---|---|
| t = 0 | compteur Population + cible de clic | l'accroche la plus tangible : peupler de ses mains |
| `P ≥ 25` | `hunting_band` (Vivres en réserve : `S₀=100`) | première récompense : « ça tourne sans moi » |
| `P ≈ 25-40` | les Vivres cessent de monter (`Fcons` rejoint `FORAGE_BASE`) | **le 1ᵉʳ plafond, ressenti** (pas annoncé) |
| `P ≥ 40` | **le curseur** Croissance↔Capacité | la 1ʳᵉ décision : élever le plafond ou pousser |
| `P ≥ 80` | `scholars` | ouvre le Savoir → les techs |
| `knowledge ≥ 15` | tech `agriculture` (puis `crop_rotation`, `granary`) | gros palier de capacité = la maîtrise s'installe |
| ~25 achats cumulés | sélecteur **×10** | achat groupé (jamais grisé avant — il *apparaît*) |
| Savoir qui monte | horizon : `writing`→`metallurgy`, 1ᵉʳ générateur d'énergie | **l'horizon industriel** (fin du slice, cf. §8) |

Tout via le mécanisme `discover`/`computeDiscovered` existant. **Aucun grisé** : absent puis présent.

---

## 5. Le script des 10-15 premières minutes (beat par beat)

1. **0:00 — Le néant.** Compteur à `0`, une cible. Le joueur clique. `+1`. `+1`. Les Vivres montent
   doucement (`FORAGE_BASE`). *Aucune* consigne. (Le Procédé est muet.)
2. **~0:30 — La bande.** À `P=25`, `hunting_band` apparaît ; le joueur a ~`100` Vivres, il l'achète
   (80). Ça clique pour lui. **Voix (1ʳᵉ ligne) :** « Ils naissent sans toi, maintenant. »
3. **~1:30 — Le mur.** Vers `P≈25-40`, `Fcons` rattrape la production : les **Vivres plafonnent**
   puis stagnent. Le joueur sent que « quelque chose bloque ». Le **curseur apparaît**. **Voix :**
   « Capacité atteinte. Élève le plafond. »
4. **~2-4:00 — La faute (le « aha »).** S'il laisse le curseur sur Croissance (ou enchaîne les
   bandes), `P` dépasse `Cap_sustain`, le **tampon de Vivres se vide**, et — pour la première fois —
   **le compteur de Population BAISSE.** La famine. Le tabou est brisé : *on peut perdre des humains*.
   (Voix : **silence** — le nombre qui descend suffit.)
5. **~4-6:00 — La reprise.** Le joueur pousse le curseur côté Capacité → `Fprod`↑ → les Vivres
   remontent → `P` repart. Il vient d'**apprendre le plafond dans sa chair**. (`agriculture` arrive
   ici et donne un grand bol d'air : `Cap_sustain ×2`.)
6. **~6-12:00 — La maîtrise.** Boucle : élever le plafond *devant* la pop, puis convertir en
   croissance en restant sous la ligne, le clic en surpoussée sur le goulot. La **courbe en S** se
   dessine. `scholars` + `crop_rotation`/`granary` approfondissent.
7. **~12-15:00 — L'horizon.** `P` en milliers, le Savoir ouvre `writing`→`metallurgy` ; le **premier
   générateur d'énergie** apparaît : la prochaine montagne (industrie → 1e13 W) se profile. Les
   éléments les plus anciens (cible de clic brute) commencent à **se replier** (culling, cf. `05`).

---

## 6. Le « aha » et l'échec (le cœur émotionnel)

Dans un jeu dont le **seul** but affiché est *plus d'humains*, voir le compteur **descendre** est une
petite déflagration : la première fissure dans la célébration, la leçon froide que **le plafond est
réel**. C'est le moment qui sépare More Humans d'un idle lisse (brief §2.2).

- **Récupérable (D1) :** jamais zéro, jamais de fin de partie ; `P` retombe vers `Cap_sustain`, `A`
  (la bande) garde un filet, la reprise est à portée de curseur.
- **Pas de hand-holding :** aucun pop-up « attention famine ». Le **nombre de Vivres qui chute** est
  l'unique signal (révélation progressive). Le joueur fait le lien lui-même — *c'est* le jeu.

---

## 7. Chiffres draft (consolidés — à caler au banc)

| Param (`01`) | Draft | Effet ressenti visé |
|---|---|---|
| `FORAGE_BASE`/`EAT` | `2.5 / 0.1` | ~`25` hab. soutenables « gratis » → 1ᵉʳ plafond vers P≈25 |
| `hunting_band` | `0.12` pop/s, `food 80` | achetable ~0:30, automatise l'amorçage |
| `BIRTH` | `0.02` /s (à `g=1`) | famine atteignable en ~2-4 min si Capacité négligée |
| `CLEAR`·`YIELD` | `0.0008 · 0.1` | la Capacité « rattrape » en ~30-60 s d'allocation |
| `FAMINE` | `0.05` | chute nette mais **réversible**, pas une falaise |
| `agriculture` | `raiseCapacity ×2`, `knowledge 40` | le grand palier de maîtrise (~5-6 min) |

> Cibles de durée : reprendre/ajuster les `TARGETS` du banc (`sim/run.ts`) — `pop 25`, `bande`,
> `pop 60`… existent déjà. Ajouter un jalon **`famine`** et un jalon **`reprise`** (cf. `03`).

---

## 8. La rampe industrielle (back-half de l'Âge 0, esquissé)

Après la maîtrise du couteau, l'Âge 0 bascule vers l'**industrie** — c'est là que **la Matière
revient** (`01 §10`) :

- **Énergie** devient le nouveau goulot : `woodfire` → `watermill` → (`metallurgy`) → `coal_plant`,
  produisant la puissance (W) qui, via `CAPACITY_ENERGY_SCALE`, **dope la capacité** au-delà de ce
  que la nourriture seule permet. `Cap_sustain` se généralise de « nourriture » à « énergie ».
- **Matière** (`resources`) réapparaît comme **monnaie de construction** des générateurs d'énergie
  (coûts actuels déjà en `resources`) : un nouveau petit arbitrage, avant-goût du levier dominant des
  âges suivants.
- **Porte Tier I :** `steam_engine` (`unlockTier 1`) à **1e13 W** ouvre la transition. Le **culling**
  replie alors le couteau néolithique (cf. `05`).

> Décision laissée ouverte (à trancher avant d'implémenter la rampe, pas avant le slice) : la Matière
> de la rampe est-elle produite par une **part du curseur** (un 3ᵉ poste, donc curseur à 3 voies en
> fin d'Âge 0) ou par des **générateurs dédiés** ? Le slice (early) n'en dépend pas.

---

## 9. Définition de « slice fini »

Le slice est livré quand, **sans tutoriel**, un testeur :
1. arrive à automatiser (`hunting_band`) sans qu'on le lui dise ;
2. rencontre le plafond et **découvre le curseur** ;
3. **subit une famine** (ou frôle), comprend la cause, et **se rétablit** ;
4. enchaîne 2-3 paliers (`agriculture`+upgrades) avec une **courbe en S** lisible ;
5. voit poindre l'**horizon industriel**.

Les assertions automatiques correspondantes sont dans `03_acceptance.md`.

# More Humans — Refacto · 05 · Pacing & culling

> **Rôle :** donner à l'IA des **cibles** (durées, seuils par âge) à viser au banc, et la **règle de
> culling** concrète qui garde une **densité d'écran constante**. Emploie `00`–`03`. Seuils =
> `data/tiers.data.ts` réels ; culling = `model/culling.ts` réel. Chiffres = drafts à caler.

---

## 1. L'invariant de game-feel

```
densité constante  =  culling (retire le passé)  +  révélation (introduit le futur)
```

À tout instant, le joueur voit **une poignée de leviers pertinents maintenant** — jamais un mur de
boutons hérités, jamais un écran qui projette le futur en grisé. C'est **l'invariant d'équilibrage le
plus important** (game-design §8.2, brief §2.3). Le pacing règle le *rythme* ; le culling règle la
*charge*. Les deux ensemble.

---

## 2. La forme visée : une courbe en S **par âge**

Chaque âge = **montée** (on casse le plafond précédent, déblocages rapides) → **plateau** (on pousse
contre le nouveau plafond, le goulot mord) → **déblocage** (la tech/énergie de sortie ouvre l'âge
suivant). Le **plateau EST le goulot** qui pousse à la transition (pacing par la physique, pas un
timer). Ni mur de grind, ni saut trivial : si un palier traîne, c'est un **bug d'équilibrage**.

---

## 3. La colonne de pacing (cibles cumulées — à viser au banc)

Portes d'énergie réelles : **Tier I `1e13 W`** (industrialisation, gate `steam_engine`) →
**Kardashev I `1e16 W`** (entrée Planétaire) → **Kardashev II `3.8e26 W`** (entrée Stellaire, **fin
v1**). Durées = fenêtres existantes de `sim/run.ts`, complétées.

| Âge / sous-beat | Jalon (prédicat) | Durée-cible (cumul) | Porte / forme |
|---|---|---|---|
| **0 — Fondation** | `pop 25`, `bande` | 20 s – 3 min | amorçage au clic → automatisation |
| **0 — Le couteau** | `pop 60`, **`famine`**, **`reprise`** | 2 – 8 min | 1ᵉʳ plafond, dépassement, maîtrise |
| **0 — Maîtrise** | `agriculture`, `pop 250`, `pop 500` | 7 – 40 min | paliers de capacité, courbe en S nette |
| **0 — Rampe industrielle** | énergie → `1e13 W` | ~1 – 3 h | Matière revient ; goulot = énergie |
| **I — Planétaire** | `Tier I` puis énergie → `1e16 W` | ~1 – 3 h pour atteindre Tier I | mix énergétique ; mur planétaire `1.7e17 W` |
| **Dyson / II — Stellaire** | `Tier II` (`3.8e26 W`) | ~3 – 10 h | chantier orbital, virage post-bio |
| **Fin v1** | `fin (II)` (tier ≥ 3) | ~4 – 15 h | vraie fin provisoire (game-design §7) |
| **III — Galactique** | — | **différé** | endgame entropie (hors v1) |

> **Nouveaux jalons à ajouter au banc** : `famine` (un tick où `P` décroît, cible ~2-4 min) et
> `reprise` (`P` repasse son pic d'avant-famine, cible ~5-7 min). Ils rendent la tension de `01`
> **mesurable** (cf. `03` S2/S5).

---

## 4. Cibles pour le banc — quoi régler

L'IA **drafte** puis **cale manette en main** (`npm run sim`) : `costGrowth` des générateurs, coûts
des techs, `BIRTH`/`CLEAR`/`YIELD`/`FAMINE` (`01 §7`), `CAPACITY_ENERGY_SCALE`, seuils. Objectif :
**chaque ligne du tableau §3 dans sa fenêtre, pour tous les profils** (`Idle`→`Acharné`), avec une S
nette par âge. Le banc échoue (`exit 1`) si `Hors cible > tol` (cf. `03` S1).

> Le tuning fin est du **playtest**, pas une vérité figée (claude.md). Les fenêtres §3 sont un point
> de départ raisonnable, pas un dogme — mais s'en écarter doit être un **choix**, pas une dérive.

---

## 5. Le culling — règle centralisée

**Contrat (existe déjà, `model/culling.ts`) :** `isCulled(elementTier, currentTier) = elementTier <
currentTier`. Un élément d'un tier **strictement inférieur** au tier courant est **replié**.
`activeGenerators` / `culledGenerators` / `culledProduction` sont fournis. **Jamais** de culling au
cas par cas dans l'UI.

**Trois sorts d'un élément sortant** (content §collapse) :

1. **Absorbé** — sa production continue de **compter** (l'`engine` somme déjà tous les `owned`), mais
   l'objet quitte la liste active et est **résumé en une ligne** « ère précédente : +X/s »
   (`culledProduction`). C'est le sort par défaut des générateurs.
2. **Replié** — déplacé dans un historique/journal consultable (`JournalView` existe), hors écran
   principal.
3. **Remplacé** — son rôle est repris par l'objet du nouvel âge (le **mini-jeu** d'avant → celui
   d'après).

**Ce qui se replie à chaque frontière (concret) :**

| Entrée dans… | Replié / absorbé | Remplacé par |
|---|---|---|
| **Tier I** | `hunting_band`, `farmland`, `scholars`, `woodfire`, `watermill`, `coal_plant` + le **couteau malthusien** | le mini-jeu **mix énergétique** |
| **Tier II** | générateurs Tier I (`oil_plant`, `fission_reactor`, `solar_array`, `wind_farm`, `fusion_reactor`) + **mix énergétique** | le **chantier orbital** (Dyson) |
| **(III, différé)** | générateurs Dyson + chantier orbital | front d'expansion / course à l'entropie |

---

## 6. Contrat de code — étendre le culling

| Cible | Aujourd'hui | À faire |
|---|---|---|
| `model/culling.ts` | générateurs seulement | **étendre** aux **upgrades** et **mini-jeux** (même `isCulled`, par `tier`) |
| `engine.ts` · production | somme **tous** les `owned` (donc cull-és inclus = absorbés) | OK ; exposer `culledProduction` comme **une ligne** de rente à l'UI |
| UI · listes (`GeneratorList`, `UpgradeList`) | — | n'afficher que les `active*` + **une** ligne résumé « ère précédente : +X/s » |
| `minigames/registry.ts` | registry par tier | **monter/démonter** le mini-jeu à la transition (le précédent **remplacé**, pas empilé) |
| `JournalView` | existe | accueillir les éléments **repliés** (consultables, hors écran principal) |

> Cohérence `Decimal`/pureté : le résumé de rente est un **agrégat dérivé** (recalculé), jamais un
> stock parallèle à maintenir.

---

## 7. Ce que `05` verrouille (pour `03`)

- **Pacing** → les fenêtres `TARGETS` (S1) + les jalons `famine`/`reprise` (S2/S5).
- **Culling** → la case « culling » de la check-list d'âme (`03 §3`) : *à l'entrée d'un tier, les
  leviers du tier précédent ont disparu de l'écran actif* ; et un test possible : `activeGenerators`
  borné (densité), `culledProduction` non nul après une transition (absorption effective).

# More Humans — Refacto · 01 · Modèle économique (Âge 0)

> **Rôle :** le modèle formel que l'IA implémente **verbatim**. Emploie le glossaire de `00`.
> **Portée :** le cœur de l'**Âge 0** (le couteau malthusien). Les âges suivants **réutilisent le
> patron** (un flux rare · un curseur · un plafond · un tampon/échec) avec d'autres variables — cf.
> `../redesign-brief.md §5.4` et `05_pacing-culling.md`.
> **Chiffres = drafts**, à caler au banc (`npm run sim`). Le *modèle* (formes des équations) est, lui,
> le contrat.

---

## 1. Le modèle en une image

```
                 curseur c (capacité) ┃ g = 1−c (croissance)
                          │           ┃           │
            défrichage    ▼           ┃           ▼   naissances
   Cultivation ──YIELD──▶ Fprod ──┐   ┃   births = A + g·BIRTH·P
        ▲                          │   ┃           │
        │ c·P·CLEAR        Cap_sustain = Fprod/EAT  │
        │                          │   ┃           ▼
        └───────────────  S (Vivres, tampon) ◀──── Fcons = P·EAT
                                   │
                       S ≤ 0  →  FAMINE  →  deaths  →  P ↓
```

Boucle de contrôle malthusienne : **on dépense de la main-d'œuvre (`L = P`) pour faire des humains**
(`g`, naissances **maintenant**) **ou pour élever le plafond nourricier** (`c`, capacité **plus
tard**). Le **tampon de Vivres `S`** est le mou : tant qu'il reste plein on encaisse, vide il y a
famine. **C'est le couteau.**

---

## 2. Variables d'état

| Symbole | Sens | Support `GameState` | Changement |
|---|---|---|---|
| `P` | Population — le score | `resources.population.amount` | inchangé (sauf : **peut décroître** en famine) |
| `S` | Vivres — **tampon consommable** | `resources.food.amount` | **redevient un buffer** (consommé), plus une monnaie infinie |
| `Cultivation` | terre défrichée cumulée (→ production de Vivres) | **nouveau champ** `cultivation: Decimal` | **à ajouter** + migration |
| `Cap_sustain` | pop soutenable = `Fprod/EAT` — le **plafond ressenti** | dérivé (≈ `capacity`) | recalculé/tick, jamais affiché |
| `c` | position du curseur ∈ [0,1] (part **capacité**) | `allocation` | **reshape** `{forage,labor}` → `{growth,capacity}` |
| `drive`, `driveTarget` | surpoussée du clic & son côté | inchangés | `driveTarget` Âge 0 = `'growth' \| 'capacity'` |
| `K`, `E` | Savoir (déblocage), Énergie (puissance/porte) | inchangés | rôle inchangé |
| `Matière` | construction | `resources.resources` | **hors Âge 0** (revient plus tard, cf. §10) |

---

## 3. Les flux par tick (par seconde ; `step` multiplie par `dt`)

```
# --- entrées joueur ---
c     = clamp(allocation.capacity / (allocation.growth+allocation.capacity), 0, 1)
g     = 1 − c
boost = 1 + drive                              # surpoussée, appliquée au SEUL côté driveTarget

# --- amorçage (terme additif A) ---
A     = Σ autoclickers.population               # hunting_band & co (clic d'amorçage : cf. §6)

# --- capacité nourricière (le plafond) ---
dCultivation = c·P·CLEAR · (driveTarget=='capacity' ? boost : 1)
Fprod        = (FORAGE_BASE + Cultivation·YIELD + Σ farms.food) · foodMult
Cap_sustain  = Fprod / EAT

# --- Vivres (tampon S) ---
Fcons   = P · EAT
dS      = Fprod − Fcons                          # peut être négatif → S décroît

# --- population ---
births  = A + g·BIRTH·P · (driveTarget=='growth' ? boost : 1)
deaths  = (S ≤ 0) ? FAMINE · max(0, Fcons − Fprod) / EAT : 0
dP      = births − deaths                        # ⚠ peut être < 0 (famine)

# --- annexes (rôle inchangé) ---
dK = P·KNOW_PER_CAPITA + Σ scholars.knowledge
E  = (Σ generators.energy) · energyMult          # puissance instantanée (W) — porte Kardashev
```

`foodMult`, `energyMult`, et les bonus de `BIRTH`/`YIELD`/`CLEAR` viennent des **effets** agrégés
(`collectModifiers`) : techs, upgrades, générateurs. Rien de nouveau côté agrégation.

---

## 4. La dynamique d'échec & de reprise (D1)

**Pourquoi ça déborde maintenant (alors que l'ancien modèle ne le pouvait pas).** L'ancienne
logistique `r·P·(1−P/Cap)` **s'asymptote** à `Cap` sans jamais la dépasser → aucun dépassement
possible, donc aucun échec (brief §2.1-2.2). Ici les **naissances sont malthusiennes** (`∝ P`,
pilotées par `g`), **découplées du plafond** : elles peuvent pousser `P` **au-dessus** de
`Cap_sustain`. Alors `Fcons > Fprod`, le tampon `S` se vide, et à `S=0` la **famine** fait
**chuter** `P`.

- **Sur-pousser (`g` trop haut, `c` négligé) :** `P` grimpe, `S` se vide, famine, `P` retombe vers
  `Cap_sustain`. **On peut se tromper.**
- **Sur-investir (`c=1`) :** `Cap_sustain` monte mais `births≈0` → `P` stagne. Main-d'œuvre **gâchée**.
- **L'optimum :** garder `Cap_sustain` **devant** `P`, puis convertir en naissances en restant sous
  le plafond, en utilisant `S` comme mou. **Anticiper le plafond** = le skill.
- **Reprise (récupérable, D1) :** repasser le curseur côté capacité → `Fprod↑` → `S` se reremplit →
  `P` repart. La famine **fait un plancher** (`P→Cap_sustain`), jamais zéro ; `A` (autoclicker)
  garde un filet d'entrée. **Pas de fin de partie.**
- **Le signal, sans texte (révélation progressive) :** le **nombre de Vivres qui descend** EST
  l'avertissement. Aucun tooltip, aucune alerte imposée.

---

## 5. Le clic dans ce modèle

Inchangé en esprit (cf. `00 D3`, `../05_mechanics.md §1`), branché sur les nouveaux termes :

- **`bootstrap`** (`P < BOOTSTRAP_DONE`) : le clic **crée** des Humains → alimente `A` (additif).
  C'est la seule fenêtre où le clic produit. `applyClick` actuel convient déjà.
- **`drive`** (au-delà) : le clic remplit `drive` → **surpoussée temporaire** du **côté du curseur**
  désigné par `driveTarget` (`'growth'` booste `births`, `'capacity'` booste `dCultivation`).
  *L'idle produit, l'actif multiplie.* `drive` retombe (`DRIVE_DECAY_PER_S`).

---

## 6. Écart assumé vs `game-design §3.3`

`game-design.md` **suggère** une croissance **logistique auto** (`dP/dt=r·P·(1−P/Cap)`). On la
**remplace** par des **naissances pilotées + tampon + famine**. Ce n'est pas une entorse : c'est
exactement le **§4-A du brief** (« rendre la métrique active, supprimer/subordonner la logistique
auto »). La **courbe en S par tier** subsiste, mais **émerge du plafond nourricier** que le joueur
doit briser, au lieu d'un asymptote gratuit. → **à répercuter dans `game-design.md §3.3`** une fois
`01` validé (note pour l'IA : ne pas laisser les deux docs se contredire).

---

## 7. Constantes d'équilibrage (DRAFT — à caler au banc)

| Const | Sens | Draft | Remplace / rejoint |
|---|---|---|---|
| `EAT` | Vivres consommées /hab/s | `0.1` | (réintroduit) |
| `FORAGE_BASE` | Vivres/s du territoire (P=0) | `2.5` | `FOOD_BASE (=1)` |
| `YIELD` | Vivres/s par point de Cultivation | `0.1` | (nouveau) |
| `CLEAR` | Cultivation /s par hab. côté capacité | `0.0008` | (nouveau) |
| `BIRTH` | taux de naissance max (à `g=1`) /s | `0.02` | `BASE_GROWTH_RATE (=0.005)` |
| `FAMINE` | coefficient de décès en famine | `0.05` | (réintroduit) |
| `S₀` | tampon de Vivres initial | `100` | inchangé (`initialState`) |
| `BOOTSTRAP_DONE` | bascule bootstrap→drive | `500` | inchangé |
| `clickPower` / `A` unitaire | +pop/clic ; pop/s d'`hunting_band` | `1` / `0.12` | inchangés |

> Cible de feel : `FORAGE_BASE/EAT ≈ 25` hab. soutenables sans rien faire (rejoint l'ancien
> `BASE_POP_CAP=25`). Le reste se trouve **manette en main** (`05_pacing-culling.md`).

---

## 8. Contrat de code — ce qui change, fichier par fichier

| Fichier · symbole | Aujourd'hui | Cible |
|---|---|---|
| `model/types.ts` · `Allocation` | `{ forage, labor }` | `{ growth: number; capacity: number }` (poids du curseur) |
| `model/types.ts` · `GameState` | — | **+ `cultivation: Decimal`** |
| `model/types.ts` · `DriveTarget` | `'growth'\|'research'\|'construction'` | Âge 0 utilise `'growth'\|'capacity'` (renommer `construction`→`capacity`) |
| `model/engine.ts` · `computeFlows` | forage/labor ; `foodConsumption:0` ; Vivres = monnaie | **`Fcons=P·EAT`**, tampon `S` qui draine, `Cap_sustain=Fprod/EAT`, accumulation `Cultivation` |
| `model/engine.ts` · naissances | logistique auto gated `reproductionUnlocked` | **`births = A + g·BIRTH·P`** (piloté) ; **retirer le gate farmland** (farmland booste `YIELD`) |
| `model/engine.ts` · `step` | `if (logistic<0) =0` (« pas de mort ») | **autoriser `dP<0`** (famine, via `deaths`) ; `S` plancher 0 |
| `model/formulas.ts` | `logisticDelta` | **ajouter** `capSustain`, `foodProduction`, `foodConsumption`, `births`, `famineDeaths`, `cultivationGain` (centralisées) |
| `model/actions.ts` · `initialState` | `allocation:{forage:1,labor:0}` | `allocation:{growth:0,capacity:1}` ; **+ `cultivation:new Decimal(0)`** |
| `model/actions.ts` · `applyClick` | bootstrap/drive | inchangé ; vérifier que `drive` cible `'growth'\|'capacity'` |
| `state/schema.ts` | version N | **bump + migration** : reshape `allocation`, init `cultivation`, `food` reste un buffer |
| `sim/run.ts` | bot forage/labor | bot **pilote le curseur** ; scénarios famine / reprise / optimum → `03` |

> Règle d'or (rappel `claude.md`) : **tout en `Decimal`**, aucune formule en dur hors `formulas.ts`,
> la boucle reste dans `core/loop` → `step`, réducteurs purs dans `actions.ts` (partagés sim/UI).

---

## 9. Invariants garantis par le modèle (ce que `03` testera)

1. **Amorçage :** à `P=0`, `dP>0` **seulement** via `A` (clic/bande). Sans clic ni bande, `P` reste 0.
2. **Dépassement atteignable :** curseur 100 % croissance, capacité négligée → famine **mesurable**
   en < ~quelques minutes, puis `P` **chute**.
3. **Sur-investissement stérile :** curseur 100 % capacité → `births≈0`, `P` stagne, `Cap_sustain` monte.
4. **Optimum non trivial :** il existe une trajectoire de curseur **pilotée** qui bat les deux
   extrêmes d'au moins X % sur Y min (le « buy-all / push-all » naïf ne domine pas).
5. **Récupérable :** après famine, repasser côté capacité fait remonter `S` puis `P` (pas de spirale
   de mort ; plancher `≈ Cap_sustain`).
6. **Monotonie hors famine :** sans dépassement, `P` ne décroît jamais (le score « monte »).
7. **Pureté :** aucune grandeur de jeu en `number` natif ; `step`/`actions` restent purs et
   déterministes (rejouables par le banc).

---

## 10. Hors-scope Âge 0 / différé

- **Matière / construction** (`resources.resources`) **recule** en Âge 0 (le couteau reste binaire,
  lisible) et **revient** comme **levier dominant** plus tard (chantier orbital / Dyson). C'est la
  *mutation de la décision par âge* (`redesign §5.4`).
- **Énergie** reste un figurant en Âge 0 (porte Tier 0→I à 1e13 W) ; elle **domine la capacité** au
  Tier I+ via `CAPACITY_ENERGY_SCALE` (déjà dans le code) — `Cap_sustain` se généralise alors de
  « nourriture » à « énergie ».
- **Le patron se réplique** (flux rare · curseur · plafond · tampon/échec) à chaque âge avec
  d'autres variables ; le détail par âge est dans `05_pacing-culling.md`.
```

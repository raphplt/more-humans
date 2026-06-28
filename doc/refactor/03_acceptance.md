# More Humans — Refacto · 03 · Harnais d'acceptation (anti-dérive)

> **Rôle :** la **définition de « fini »**. Une IA fera passer le chemin le plus court vers le vert —
> donc les tests doivent asserter **l'âme** (famine atteignable, optimum non trivial, zéro grisé),
> pas seulement « ça tourne ». Emploie `00`–`02`.
> **Principe directeur : VERT ≠ FINI.** Le dernier verrou est une **revue d'âme** humaine (ou
> déléguée à un sous-agent), parce que certaines propriétés ne sont pas mécanisables.

---

## 0. Pourquoi ce doc existe

Le code actuel est « tout vert » **et** sans âme (brief §1-2) : preuve qu'un harnais qui teste la
mécanique sans tester le **propos** ne protège de rien. On corrige par trois couches :

1. **Propriétés du modèle** — tests unitaires déterministes (`test/`), assertent les invariants de `01 §9`.
2. **Assertions du banc** — scénarios joués (`sim/`), assertent les propriétés **système** (échec
   atteignable, optimum non trivial, pacing).
3. **Check-list d'âme** — revue (humaine/sous-agent) de ce qu'aucun test ne capte.

« Fini » = les **trois** passent. Pas deux.

---

## 1. Couche 1 — Propriétés du modèle (`test/economy.test.ts`, nouveau)

Tests purs sur `engine`/`formulas` (déterministes, rapides). Chaque ligne ↔ un invariant de `01 §9`.

| id | Propriété (assertion) | Montage | Réf |
|---|---|---|---|
| U1 | **Amorçage strict** : `P=0`, aucune bande, N ticks → `P` reste `0`. Avec `applyClick` ou une `hunting_band` → `P` croît | `initialState`, boucle `step` | `01 §9.1` |
| U2 | **Famine atteignable** : `P` élevé, `cultivation` basse, curseur=Croissance → après k ticks, `food=0` **et** `P(t+1) < P(t)` | état forgé + `step` | `01 §9.2` |
| U3 | **Sur-investissement stérile** : curseur=Capacité (c=1) → `births≈0` (`ΔP < ε`) tandis que `Cap_sustain` monte | état forgé + `step` | `01 §9.3` |
| U4 | **Monotonie hors famine** : si `S>0` et `P≤Cap_sustain` sur toute la trajectoire → `P` ne décroît jamais | trajectoire contrôlée | `01 §9.6` |
| U5 | **Récupérable** : après une famine (P chuté), curseur=Capacité → `S` repasse `>0` puis `P` repart ; plancher `≈Cap_sustain`, jamais `0` | enchaîne U2 puis reprise | `01 §9.5` |
| U6 | **Pureté/déterminisme** : `step(s,dt)` ne mute pas `s` ; deux appels identiques → mêmes `.toString()` ; aucun `NaN`/`Infinity` | comparaison d'égalité | `01 §9.7` |
| U7 | **Discipline `Decimal`** : toutes les grandeurs de `GameState` sont `instanceof Decimal` après `step` | garde runtime | `claude.md` |
| U8 | **Notation pleine** : `format()` d'un grand `Decimal` → **aucun** exposant (`/[eE]\+?\d/` absent), chiffres pleins | étend `test/notation.test.ts` | `01`, `architecture §6` |
| U9 | **Révélation = absence** : `<Discoverable>` non découvert **ne rend rien** (pas un grisé) ; coût de lot = somme géométrique | composant + `test/formulas.test.ts` | `02 §4` |

> Seuils (`ε`, `k`) = drafts à fixer en écrivant les tests. Garder les tests **forgés** (états
> construits à la main) pour qu'ils restent rapides et lisibles, pas des parties complètes.

---

## 2. Couche 2 — Assertions du banc de simulation (`sim/`)

Étendre `sim/run.ts` (profils, jalons, `TARGETS` existent déjà) et **faire échouer le process**
(`exit 1`) si une assertion casse — sinon la couche est décorative.

| id | Scénario (bot) | Assertion | Seuil draft |
|---|---|---|---|
| S1 | profils existants (`Idle`→`Acharné`) | chaque jalon dans sa fenêtre `TARGETS` ; `Hors cible ≤ tol` | `tol = 2` |
| S2 | **bot naïf** : curseur 100 % Croissance + rachète toutes les bandes | **subit ≥ 1 famine** (un tick où `P` décroît) en `≤ 5 min` | famine obligatoire |
| S3 | **optimum non trivial** : 3 bots — tout-Croissance, tout-Capacité, **piloté** (anticipe le plafond) | le piloté **bat les deux extrêmes** en pop finale sur 15 min | `≥ +20 %` |
| S4 | tous profils | aucun **runaway** (explosion) ni **stall** permanent à 0 ; tous atteignent l'horizon industriel | 0 échec |
| S5 | reprise après échec | bot qui passe Capacité après famine → `P` **repasse son pic d'avant-famine** | `≤ 3 min` |
| S6 | hors-ligne | `elapsed` long → **plafonné**, rejoué sans explosion | cap `8 h` |

> Ajouter les jalons `famine` et `reprise` à `MILESTONES`. S2+S3 sont les assertions **anti-idle-
> lisse** : si le « pousser tout » ne se paie pas et qu'un pilotage fin ne récompense pas, le couteau
> n'existe pas → build refusé.

---

## 3. Couche 3 — Check-list d'âme (revue, non mécanisable)

À cocher **à chaque jalon de build** (`06`), par un humain **ou un sous-agent de vérification** (lit
le diff + joue à l'aveugle). Mappée au frame (`redesign §5`) et aux six beats (`02 §1`).

- [ ] **Les six beats se ressentent** en test à l'aveugle, **sans tutoriel** : clic→auto→curseur→
      famine→maîtrise→horizon.
- [ ] **Zéro grisé** : un élément non débloqué est **absent** (pas un bouton désactivé/opacifié).
- [ ] **Zéro sur-explication** : pas de tooltip/description imposé ; le sens vient de l'action.
- [ ] **Densité bornée** : `≤ ~7` éléments actionnables à l'écran à tout instant de l'Âge 0.
- [ ] **Population héros** : compteur toujours présent, **jamais relabellisé**, chiffres pleins.
- [ ] **Voix** : `≤ ~6` lignes en Âge 0, chacune conforme à `04` (froide, ne **jamais** expliquer une
      mécanique).
- [ ] **La famine pique** : voir le compteur **descendre** est lisible comme un évènement, pas un bug.
- [ ] **Culling** : à l'entrée du tier suivant, les leviers de l'Âge 0 se replient (pas un mur hérité).
- [ ] **DA chargée** : tableau de bord « instrument » du Procédé, palette d'ère — pas un thème par défaut.

> Un beat qui « passe les tests » mais **ne se ressent pas** = échec de la check-list = build non fini.
> C'est l'anti-dérive ultime : la machine ne peut pas cocher ça à ta place.

---

## 4. La définition de « fini » (le verrou)

Un incrément de build est **fini** quand **tout** ci-dessous est vrai :

1. `npm run typecheck` — propre (TS strict, aucun `any` implicite).
2. `npm run lint` — propre.
3. `npm test` — vert (couche 1 incluse, `economy.test.ts` nouveau).
4. `npm run sim` — `Hors cible ≤ tol` **et** assertions S2-S6 OK (process `exit 0`).
5. **Revue d'âme** (couche 3) signée — par un humain ou un sous-agent dédié.

Manque-t-il **un seul** des cinq → **pas fini**. En particulier : *vert sans revue d'âme ≠ fini*.

---

## 5. Câblage & anti-gaming

- **Asserter des résultats, pas des implémentations** : S2/S3 comparent des **pop finales** et des
  **évènements** (famine), pas des nombres d'appels de fonctions → l'IA ne peut pas « coder pour le
  test » sans recréer la vraie dynamique.
- **Scénarios seedés** (`createRng(SEED)`) : reproductibles, donc un échec est rejouable et
  diagnosticable (cf. `engineering:debug`).
- **CI / pré-merge** : `typecheck && lint && test && sim` bloquants ; la revue d'âme est une **gate
  humaine/sous-agent** au jalon, pas un test.
- **Délégation de la revue** : la couche 3 peut être confiée à un sous-agent (`Task`) qui lit le diff,
  vérifie chaque case, et **rend un verdict motivé** plutôt qu'un simple « vert ».

---

## 6. Ce que `03` débloque

`04` (voix) fournit les lignes que la check-list §3 vérifie ; `05` (pacing/culling) fournit les
fenêtres `TARGETS` et la règle de culling que S1 et la case « culling » testent ; `06` (build-plan)
place ces gates à chaque jalon.

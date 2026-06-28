# More Humans — Refacto · 06 · Plan de build

> **Rôle :** orchestrer `00`–`05` en une **séquence exécutable par une IA**, avec une **porte de
> revue à chaque jalon**. C'est un **refactor d'un code qui marche** (pas un greenfield) : on
> **modifie** l'existant et on **met à jour les tests existants**, on n'empile pas.

---

## 1. Principes d'exécution (transverses, non négociables)

1. **Tests d'abord pour le modèle.** Écrire les assertions de `03` (couches 1-2) **avant** le code du
   modèle : elles définissent la cible. Rouge d'abord, puis vert — c'est l'anti-dérive.
2. **Le plus petit frame d'abord.** Prouver le frame à l'échelle de l'**Âge 0** (le couteau + la
   famine) **avant** d'empiler le moindre âge. Phase A ci-dessous = le point de validation.
3. **Migration à chaque changement d'état.** Tout nouveau champ / reshape → `state/schema.ts` version
   bumpée + migration ; une save existante doit survivre (claude.md).
4. **La porte des 5 verrous à chaque jalon** (`03 §4`) : `typecheck` · `lint` · `test` · `sim` ·
   **revue d'âme**. *Vert sans revue d'âme ≠ fini.*
5. **Revue d'âme délégable** à un sous-agent (`Task`) qui lit le diff, joue à l'aveugle, coche `03 §3`
   et **rend un verdict motivé**.
6. **Discipline permanente :** `Decimal` partout · boucle hors React (`core/loop`→`step`) · réducteurs
   purs (`actions.ts`, partagés sim/UI) · formules centralisées (`formulas.ts`).
7. **Docs canoniques alignés :** toute déviation actée ici se **répercute** dans les docs sources
   (ex. `game-design §3.3` logistique → naissances pilotées, cf. `01 §6`) — jamais deux docs qui se
   contredisent.

---

## 2. La séquence

### PHASE A — Le vertical slice de l'Âge 0 (prouver le frame)

**M0 — Harnais d'abord (rouge).** `03` couches 1-2 pour l'Âge 0 : créer `test/economy.test.ts`
(U1-U9, stubs), étendre `sim/run.ts` (jalons `famine`/`reprise`, bots S2/S3/S5, `exit 1` si échec).
*Gate :* le harnais **compile** et est **rouge pour les bonnes raisons**.

**M1 — Le modèle (`01`).** Implémenter : `Allocation`→`{growth,capacity}`, champ `cultivation`,
`Fcons`+tampon+famine, **naissances malthusiennes pilotées**, `Cap_sustain`, retrait du gate
auto-repro. Mettre à jour `engine.ts`/`formulas.ts`/`actions.ts`, **migration** `schema.ts`, adapter
le bot du banc et **les tests existants** (`engine.test.ts`…). Répercuter `game-design §3.3`.
*Gate :* couche 1 (U1-U9) verte ; couche 2 (S2/S3/S5) verte. Headless, pas d'UI. Pas de revue d'âme
(rien à voir encore) — mais le **banc prouve la dynamique** (famine atteignable, optimum non trivial).

**M2 — Le verbe & l'UI du slice (`02`).** Drop-in nu (compteur + clic), **le curseur**, le
clic-surpoussée, l'ordre de révélation (`discover`), objets re-costés. **Supprimer le hand-holding**
(cf. §4). **Zéro grisé** (`<Discoverable>` rend `null`).
*Gate :* les 5 verrous **+ 1ʳᵉ revue d'âme** : les **six beats** se ressentent à l'aveugle, la famine
pique, densité `≤ ~7`.

**M3 — La voix & la DA chargée (`04` + frame §5.7).** `data/voice.data.ts` (≤6 lignes, data-driven
façon `achievements`), état `narrated` + migration, branché sur le `Toaster`. DA = tableau de bord du
Procédé ; palette d'ère ; compteur Population héros.
*Gate :* grep des drapeaux rouges (`04 §7`) ok ; revue d'âme du **ton** et de la **DA**.

> **★ Fin de Phase A = le slice jouable, âme validée.** **STOP. Playtest. Itère.** On ne stacke aucun
> âge tant que ce point n'est pas net manette en main. C'est *la* décision de go/no-go du refacto.

### PHASE B — Empiler les âges (une fois A validé)

**M4 — Rampe industrielle + Tier I + 1ᵉʳ culling (`02 §8`, `05`).** Énergie `woodfire`→`coal`, **la
Matière revient**, `steam_engine` → porte `1e13 W`. **Culling** Tier 0→I (replier les leviers
néolithiques, ligne de rente absorbée) ; **étendre `culling.ts`** aux upgrades/mini-jeux.
*Gate :* 5 verrous + culling (les leviers de l'Âge 0 ont disparu de l'écran actif) + pacing énergie.

**M5 — Âge I Planétaire : mini-jeu mix énergétique (`05`).** Le mix **remplace** le couteau (registry
monte/démonte) ; énergie `1e13`→`1e16` ; mur planétaire `1.7e17 W`. Le mix est une **vraie décision**
(assertion banc dédiée).
*Gate :* 5 verrous + revue d'âme (le mix est un arbitrage, pas un slider décoratif).

**M6 — Transition Dyson / Âge II + post-bio + fin v1.** Chantier orbital (remplace le mix), énergie
→`3.8e26 W`, **virage post-bio = méthode derrière le flag** `transhumanLabels` (métrique inchangée),
**vraie fin provisoire** (game-design §7).
*Gate :* 5 verrous + revue d'âme (le virage glace ; la fin atterrit).

### DIFFÉRÉ (hors v1, architecturé pas codé)

Âge III (endgame entropie) · couche roguelite (runs/variance, `exclusiveGroup` déjà prêt) · codex ·
achievements étendus. Ne **rien** coder sans demande explicite (claude.md périmètre).

---

## 3. Gabarit de porte de revue (à chaque jalon)

```
[ ] npm run typecheck   — propre (strict)
[ ] npm run lint        — propre
[ ] npm test            — vert (tests existants MIS À JOUR + nouveaux)
[ ] npm run sim         — Hors cible ≤ tol ; S2..S6 ok ; exit 0
[ ] revue d'âme (03 §3) — signée (humain ou sous-agent), verdict motivé
[ ] migration de save   — si l'état a changé, version bumpée + ancienne save chargée OK
```

Manque un seul item → **le jalon n'est pas fini**.

---

## 4. Ce qu'on supprime explicitement (anti-hand-holding, brief §2.3 / §7)

À retirer en M2 : le **fil d'objectif**, les libellés **« Premiers foyers »**, les **descriptions/
tooltips imposés**, **tout grisé** d'élément non débloqué, le réglage `notation` autre que `full`
(+ `scientific()`). Le sens vient de l'action, pas d'un paragraphe.

---

## 5. Risques de dérive & parades

| Risque (l'IA tend à…) | Parade (dans ce plan) |
|---|---|
| reconverger vers un idle générique « lisse » | banc S2/S3 (famine obligatoire, optimum non trivial) + revue d'âme |
| rapporter « vert » sans âme | la porte à **5 verrous**, revue obligatoire |
| sur-écrire la voix / expliquer | `04` (garde-fous) + grep des drapeaux rouges |
| empiler le contenu avant que le cœur tienne | **Phase A d'abord**, STOP/playtest avant Phase B |
| casser une save | migration à chaque changement d'état |
| laisser deux docs se contredire | principe transverse #7 (répercussion) |

---

## 6. Démarrage

Commencer **maintenant** par **M0 puis M1** (le modèle, headless, prouvé au banc). Ne pas ouvrir l'UI
(M2) tant que la dynamique de `01` n'est pas verte au banc. C'est le chemin le plus court vers un
**slice qui prouve le frame** — le reste en découle.
```

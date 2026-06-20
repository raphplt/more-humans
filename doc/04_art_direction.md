# More Humans — Direction artistique & UX

> Ce doc est un **pilier**, pas du polish de fin (cf. `game-design §8`). More Humans est un projet
> artistique : l'identité visuelle et l'UX sont conçues, pas improvisées. Une UI « site générique
> vibe-codé » (cartes slate, bordures partout, tooltips verbeux, boutons grisés) est un **bug**.

---

## 1. Vision

Une interface **épurée, minimaliste, intentionnelle**. Le jeu raconte la croissance de l'humanité
des limites physiques de l'univers : l'écran doit donner la sensation d'un **instrument** qu'on
manipule, pas d'un tableau de bord SaaS. Chaque pixel justifie sa présence. Le silence visuel est
une fonctionnalité : il laisse respirer les rares éléments qui comptent, et il fait ressortir la
montée des chiffres (qui s'affichent **pleins**, cf. `architecture §6`).

Trois principes directeurs :

1. **Sobriété.** Peu de couleurs, peu de cadres, beaucoup de vide. La hiérarchie se fait par
   l'espace et la typo, pas par des boîtes et des bordures.
2. **Révélation progressive.** On ne montre jamais tout. Les systèmes émergent un par un (§5).
3. **Commutabilité.** Toute la couche visuelle passe par des **design tokens** : on peut basculer
   entre plusieurs chartes sans toucher aux composants (§3).

---

## 2. Ce qui ne va pas aujourd'hui (à corriger)

État actuel = Tailwind dark générique : `bg-slate-900/40`, `border-slate-700` sur chaque section,
boutons violets, titres `uppercase tracking-wide`, tooltips et hints partout, cibles de clic
sur-décrites, futurs éléments grisés. Problèmes :

- **Couleurs littérales** (`slate-700`, `violet-600`) codées en dur dans les composants → impossible
  de changer de charte proprement. → **Tout passe par des tokens** (§3).
- **Sur-explication** : chaque bouton a un titre, un hint, une description. → **On coupe** (§5).
- **Cadres partout** : chaque bloc est une carte bordée. → hiérarchie par **espace**, pas par boîtes.
- **Grisé du futur** : les éléments non débloqués sont visibles grisés. → **absence**, pas grisé (§5).

---

## 3. Système de thèmes (design tokens)

Réponse à « pouvoir switcher de charte facilement » : **un seul jeu de tokens** (variables CSS),
dont les valeurs changent selon `data-theme` sur `<html>`. Tailwind *consomme* ces tokens ; les
composants n'utilisent que des classes sémantiques (`bg-surface`, `text-muted`, `border-line`…),
**jamais** une couleur littérale. Détail technique : `architecture §9`.

### 3.1 Le vocabulaire de tokens (stable entre toutes les chartes)

| Token | Rôle |
|---|---|
| `--bg` | fond de la page |
| `--surface` | fond d'un élément posé (rare — souvent transparent) |
| `--line` | filets, séparateurs, contours fins |
| `--text` | texte principal |
| `--muted` | texte secondaire / inactif |
| `--accent` | UNE couleur d'accent (action vive, valeur clé) |
| `--accent-soft` | variante atténuée de l'accent (états intermédiaires) |
| `--positive` / `--warn` | feedbacks rares (gain notable / plafond atteint) |
| `--font-ui` | typo d'interface |
| `--font-num` | typo des nombres (chiffres tabulaires, lisibilité) |
| `--radius` | rayon des rares coins arrondis |
| `--space` | unité d'espacement de base |
| `--line-w` | épaisseur de filet |

Règle d'or : **un thème = un fichier d'overrides de ces tokens.** Aucun composant ne sait quel
thème est actif. Ajouter une charte = ajouter un bloc `[data-theme="…"]`, zéro refactor.

### 3.2 Les trois directions (commutables)

Les trois sont gardées « sous le coude » et sélectionnables dans les réglages. **Défaut :
instrument scientifique.**

#### A. Instrument scientifique *(défaut)*

Esthétique tableau de bord / panneau de contrôle d'un vaisseau. Lignes fines, données au premier
plan, presque pas de remplissage.

- **Palette :** fond très sombre, presque neutre (encre bleutée/charbon, pas un noir pur), texte
  blanc cassé, **un seul accent** froid et précis (cyan/ambre instrument — à figer en implémentant).
  Pas de dégradés tape-à-l'œil ; au plus un voile subtil.
- **Filets :** séparateurs 1px discrets, graduations fines façon échelle de mesure. Les « cartes »
  disparaissent : des zones délimitées par un filet ou par l'espace, pas par des boîtes pleines.
- **Typo :** UI sans-serif neutre et serrée (Inter/IBM Plex Sans) ; **nombres en chiffres
  tabulaires** (IBM Plex Mono / police à chasse fixe) pour que les compteurs ne « sautent » pas.
- **Motif signature :** l'**échelle de Kardashev** comme jauge-instrument (Type 0.73 → 1.00 → 2.00),
  rendue comme un cadran/règle plutôt qu'une barre de progression web banale.
- **Ton :** précis, froid, scientifique. L'humanité vue depuis le poste de pilotage.

#### B. Brutalisme typographique

- **Palette :** fond quasi-noir, texte clair, **une** couleur d'accent saturée. Zéro autre couleur.
- **Filets/boîtes :** quasi aucun. La structure est portée par la **typographie** (tailles, graisses,
  interlignes) et le vide. Le texte EST l'interface.
- **Typo :** une famille forte (grotesque ou mono), contrastes de taille marqués. Les nombres pleins
  deviennent des objets graphiques.
- **Ton :** Paperclips modernisé, austère, conceptuel.

#### C. Minimalisme cosmique

- **Palette :** dégradés d'espace profond (indigo → noir), accent lumineux unique. Atmosphérique.
- **Motif signature :** un **objet céleste central qui évolue** avec la progression — foyer →
  planète éclairée → étoile → essaim de Dyson → halo galactique. Discret, jamais bruyant.
- **Filets :** doux, halos plutôt que traits ; parcimonie absolue.
- **Ton :** contemplatif, émotionnel, le vertige des échelles.

> Les trois partagent **les mêmes composants et le même layout** ; seules les valeurs de tokens et
> un ou deux motifs signature (cadran / typo / astre) changent. C'est ce qui rend le switch instantané.

---

## 4. Layout & composants (commun aux chartes)

- **Une colonne centrée, aérée**, pas une grille 2 colonnes saturée. La largeur max est généreuse
  mais le contenu reste resserré et hiérarchisé verticalement.
- **En-tête sobre :** la métrique reine — **Population, en chiffres pleins** — domine, seule, en haut.
  Énergie (W + type Kardashev) et Savoir en second rang, plus discrets. Pas de barre d'icônes.
- **Zone d'action :** le clic (amorçage puis pilotage) et le mini-jeu du tier courant. Au tier 0,
  c'est l'amorçage ; il se transforme ensuite.
- **Listes (générateurs/techs) :** lignes minimales — nom, effet implicite, coût, action. **Pas** de
  description par défaut ; le détail apparaît à la demande (survol/clic), pas en permanence.
- **Sélecteur d'achat ×1/×10/×100 :** discret, près des listes ; ×10 et ×100 *apparaissent* quand
  débloqués (cf. §5), jamais affichés grisés.
- **Pas de footer encombré.** Sauver/Exporter/Importer/Réglages dans un menu discret, pas une rangée
  de boutons bordés.

---

## 5. UX — Révélation progressive (à la Paperclips, poussé à l'extrême)

> Le sens se **comprend en jouant**, il n'est pas projeté à l'avance. Règles non négociables.

### 5.1 Montrer peu

- **Écran de départ quasi nu :** au lancement, presque rien — de quoi faire le premier geste
  d'amorçage. Tout le reste **naît** ensuite.
- **Couper la sur-explication :** supprimer les descriptions verbeuses, les hints redondants, les
  tooltips par défaut. Un libellé court + l'effet visible suffisent. Le détail est *disponible à la
  demande*, jamais imposé.
- **Densité minimale constante :** combiné au culling (`content §collapse`), l'écran garde toujours
  une poignée d'éléments pertinents — jamais un mur.

### 5.2 Dévoiler à temps — absence, pas grisé

- Un élément non débloqué est **absent du DOM**, pas affiché grisé. Le grisé révèle le futur et tue
  la surprise ; l'absence préserve la découverte.
- Quand sa condition d'apparition est atteinte, il **apparaît** avec une micro-transition d'entrée
  (fondu/glissé court). Une fois apparu, il reste (pas de clignotement) — voir `discovered` dans
  `architecture §10`.
- **Trois états seulement** (jamais un « grisé futur ») :
  1. *non découvert* → absent ;
  2. *découvert mais pas encore abordable* → visible, sobre, action inerte/discrète (sans gros
     cadenas « LOCKED ») ;
  3. *abordable* → action mise en avant par l'accent.

### 5.3 Laisser l'histoire émerger

- Pas d'écran de lore ni de tutoriel mur-de-texte. La narration passe par **ce qui apparaît et quand**
  (un nouveau système = un chapitre), par de rares lignes de flavor au franchissement d'un palier,
  et par le codex *optionnel* (consultable, jamais imposé).
- Les transitions de phase sont des **moments** : un changement visuel net (le motif signature
  évolue, l'ancien système se replie), pas une pop-up qui explique.

---

## 6. Motion & game-feel (sobre, jamais clinquant)

- **Micro-feedbacks** sur les actions clés : une naissance d'Humain à l'amorçage, un palier de Dyson
  posé, un tier franchi. Discrets, satisfaisants, jamais bruyants.
- **Compteurs animés** : les nombres pleins montent en douceur (tween court), chiffres tabulaires
  pour éviter le tremblement de mise en page.
- **Transitions d'apparition/disparition** : entrée des éléments découverts, repli des éléments
  cull-és. Courtes (~150–250 ms), cohérentes.
- **Pas de** particules gratuites, secousses, sons criards par défaut. Le juice sert la lisibilité
  et l'émotion d'échelle, pas la décoration. (Sons/haptique = option, off par défaut.)
- **Respecter `prefers-reduced-motion`.**

---

## 7. Checklist pour l'implémenteur

- [ ] Aucune couleur/typo littérale dans un composant — **uniquement des tokens**.
- [ ] `data-theme` commutable ; les trois chartes rendent le même layout.
- [ ] Population en **chiffres pleins**, chiffres tabulaires, en tête, seule métrique reine.
- [ ] Zéro élément grisé « futur » : absence → apparition.
- [ ] Zéro description/tooltip imposé par défaut ; détail à la demande.
- [ ] Densité d'écran bornée (révélation + culling).
- [ ] `prefers-reduced-motion` honoré ; pas de juice clinquant.

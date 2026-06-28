# More Humans — Refacto · 04 · Bible de voix

> **Rôle :** la voix **du Procédé** (frame `redesign §5.6`). Les IA **sur-écrivent, expliquent,
> rassurent** — donc ce doc est d'abord une liste de **garde-fous**, puis une **map déclencheur→ligne**
> que la check-list `03 §3` vérifie. Emploie `00`.
> **Mètre-étalon :** si tu hésites, **coupe la ligne**. Le silence est la voix par défaut.

---

## 1. Qui parle

**Le Procédé** : l'optimiseur froid que le joueur *est*. Il ne perçoit pas des personnes, il perçoit
le compteur. Il ne raconte pas une histoire — il **note**, il **ordonne**. La célébration vient des
chiffres, de la DA, du rythme ; **la voix est le contrepoint glacé** qui se révèle lentement.

---

## 2. Les règles (le cœur du doc)

**FAIRE**

- **Rare.** `≤ ~6` lignes pour tout l'Âge 0. Une ligne = une bascule. Le reste du temps, **rien**.
- **Littéral, sans affect.** Constat ou impératif. Phrases courtes. Point final, jamais « ! ».
- **Nommer les humains comme un compte** : « ils », « le nombre », « les unités », « le rendement ».
  Jamais « tes gens », « ta communauté » (chaleur = hors personnage), **jusqu'au** retournement tardif
  où la froideur devient explicite et assumée.
- **Impératif ou 2ᵉ personne froide** : « Élève le plafond. » / « Tu as compté. »
- **Causalité nue**, jamais la consigne : « La nourriture ne suffira plus. » (PAS « clique sur
  Capacité pour produire des Vivres »).

**NE PAS FAIRE** (drapeaux rouges — toute ligne qui en coche un est **rejetée**)

- ❌ **Expliquer une mécanique** (« le curseur répartit la main-d'œuvre… »). La découverte EST le jeu.
- ❌ **Rassurer / encourager** (« ne t'inquiète pas », « bravo », « bien joué »).
- ❌ **Point d'exclamation, emoji, exclamation de joie.**
- ❌ **Tutoriel, lore-dump, paragraphe.** Jamais > 1 phrase (2 très courtes max à un climax).
- ❌ **Questionner les émotions du joueur** (« content ? »), s'adresser à lui comme à un ami.
- ❌ **Chiffres en toutes lettres / notation** dans la copy (cf. `01`, chiffres pleins ailleurs).
- ❌ **Se répéter.** Une ligne ne se dit **qu'une fois** (monotone).

---

## 3. Le mouvement tonal — la célébration qui se glace

La voix ne devient pas « méchante » : elle **reste littérale** pendant que l'enjeu devient monstrueux.
C'est ça, le froid.

| Âge | Registre de la voix |
|---|---|
| 0 — Aube | quasi neutre, observation ; pourrait presque passer pour bienveillante (l'ambiguïté est voulue) |
| I — Planétaire | efficacité, ressources ; « rapide / lent », « épuiser » |
| Dyson / II | échelle stellaire, gaspillage à corriger ; l'humain devient « substrat » |
| II post-bio | le retournement : la froideur se **nomme** elle-même |
| III — fin | minimal, terminal ; une dernière ligne |

---

## 4. Map déclencheur→ligne — Âge 0 (les lignes que `03 §3` vérifie)

| Déclencheur (prédicat d'état) | Ligne | Ce qu'elle fait |
|---|---|---|
| 1ʳᵉ `hunting_band` achetée | « Ils naissent sans toi, maintenant. » | récompense **et** 1ᵉʳ frisson : l'autonomie |
| 1ᵉʳ plafond atteint (Vivres stagnent, curseur apparaît) | « Capacité atteinte. Élève le plafond. » | l'unique « consigne » — un ordre, pas une explication |
| 1ʳᵉ famine (P décroît) | **(silence)** | le compteur qui descend suffit ; la voix ne pleure pas |
| reprise après famine (P repasse son pic) | « Le nombre remonte. Continue. » | indifférence aux morts : seul le compte importe |
| horizon industriel (1ᵉʳ générateur d'énergie) | « La nourriture ne suffira plus. Il faut brûler. » | pointe l'âge suivant, sans l'expliquer |
| franchissement Tier I | « Une planète a un plafond, elle aussi. » | installe la tension éternelle : toujours un plafond |

> ~5 lignes audibles sur ~15 min. Si tu en ajoutes, tu te trompes : **coupe**.

---

## 5. Le patron pour les âges suivants (1 exemple/registre — pas à écrire maintenant)

| Bascule | Registre | Exemple |
|---|---|---|
| Mix énergétique (I) | efficacité, épuisement | « Le charbon est rapide. Le rapide s'épuise. » |
| Chantier Dyson | gaspillage stellaire | « Une étoile gaspille sa lumière. Récupère-la. » |
| Virage post-bio (II) | le retournement | « Le rendement biologique plafonne. Il existe un substrat plus efficace. » → plus tard : « Tu n'as jamais compté des vies. Tu as compté. » |
| Endgame (III) | terminal | « Plus n'est plus possible. » |

> Le **virage post-bio** : la voix le **motive mécaniquement** (substrat plus efficient) **sans
> relabelliser la métrique** ; toute relabellisation cosmétique reste **derrière le flag**
> `settings.transhumanLabels` (`00`, non-négociable #8).

---

## 6. Forme & implémentation (data-driven, comme les succès)

- **Une ligne = une donnée** : `VoiceLineDef { id; tier; test: (s:GameState)=>boolean; text; }`,
  dans `data/voice.data.ts`, surfacée par un registry calqué sur `data/achievements.data.ts`
  (`newlyUnlocked`/`narrated`).
- **Monotone** : champ d'état `narrated: Record<string,boolean>` (comme `achievements`) → une ligne ne
  refire jamais. **Migration de save** (cf. `claude.md`).
- **Présentation** : style **journal d'instrument** (cf. DA), bref, **non bloquant**, auto-disparaît ;
  jamais une modale qui interrompt. Réutiliser/voisiner le `Toaster` existant.
- **Couper = données** : retirer une ligne = retirer une entrée. Le flag transhumaniste coupe son
  lot sans toucher au reste.

---

## 7. Garde-fou anti-régression (ce que le reviewer/sous-agent grep)

Rejeter tout build dont une ligne de voix : explique une mécanique · rassure/félicite · dépasse
1 phrase · contient `!`/emoji · se répète · nomme les humains avec chaleur (hors retournement assumé).
Compter les lignes par âge : **Âge 0 ≤ 6**. Au-delà → dérive.

/*
 * Banc de simulation d'équilibrage — More Humans.
 *
 * Rejoue le VRAI moteur (model/engine + model/actions, partagés avec le jeu) sans UI, avec des
 * profils de joueurs (vitesse de clic, régularité, fréquence d'achat), et mesure le temps pour
 * atteindre chaque jalon, comparé à des CIBLES de durée.
 *
 * Lancer :  npm run sim
 *
 * Étendre (tout est en tête de fichier) :
 *   - PROFILES   : ajoute un profil de joueur.
 *   - MILESTONES : ajoute un jalon mesuré (prédicat sur l'état).
 *   - TARGETS    : fixe la fenêtre de durée souhaitée [min, max] en secondes pour un jalon.
 * Le bot d'achat (buyStep) est volontairement générique (greedy + réserve de Vivres) ; affine-le
 * si tu veux modéliser des stratégies plus fines.
 */
import Decimal from 'break_infinity.js';
import type { GameState, ResourceId } from '../src/model/types';
import { clickRegime, rates, step } from '../src/model/engine';
import {
  applyBuyGenerator,
  applyBuyTech,
  applyBuyUpgrade,
  applyClick,
  initialState,
} from '../src/model/actions';
import { canAfford, generatorBatchCost, isUnlocked } from '../src/model/formulas';
import { GENERATORS } from '../src/data/generators.data';
import { TECHS } from '../src/data/techs.data';
import { UPGRADES } from '../src/data/upgrades.data';
import { createRng } from '../src/core/rng';

// ----------------------------------------------------------------------------------------------
// Paramètres de simulation
// ----------------------------------------------------------------------------------------------
const FIXED = 0.1; // pas fixe du moteur (doit matcher core/loop.FIXED_STEP_S)
const MAX_GAME_SECONDS = 2 * 3600; // durée max simulée par partie (au-delà : jalon UNREACHED)
const FOOD_RESERVE_SEC = 20; // le bot garde ~20 s de Vivres en réserve (ne se famine pas)
const SEED = 12345;

interface Profile {
  name: string;
  clicksPerSec: number; // cadence moyenne de clic (en régime amorçage)
  jitter: number; // 0..1 : irrégularité du timing des clics
  decisionEverySec: number; // à quelle fréquence le bot réévalue ses achats
  laborShare: number; // 0..1 : part de Labeur visée une fois l'allocation disponible
}

const PROFILES: Profile[] = [
  { name: 'Idle',       clicksPerSec: 0.3, jitter: 0.8, decisionEverySec: 15, laborShare: 0.3 },
  { name: 'Tranquille', clicksPerSec: 1,   jitter: 0.5, decisionEverySec: 5,  laborShare: 0.3 },
  { name: 'Régulier',   clicksPerSec: 3,   jitter: 0.2, decisionEverySec: 2,  laborShare: 0.4 },
  { name: 'Acharné',    clicksPerSec: 8,   jitter: 0.3, decisionEverySec: 1,  laborShare: 0.5 },
];

interface Milestone {
  name: string;
  test: (s: GameState) => boolean;
}

const MILESTONES: Milestone[] = [
  { name: 'pop 25',   test: (s) => s.resources.population.amount.gte(25) },
  { name: 'bande',    test: (s) => (s.owned['hunting_band'] ?? 0) >= 1 },
  { name: 'pop 60',   test: (s) => s.resources.population.amount.gte(60) },
  { name: 'ferme',    test: (s) => (s.owned['farmland'] ?? 0) >= 1 },
  { name: 'pop 250',  test: (s) => s.resources.population.amount.gte(250) },
  { name: 'pop 500',  test: (s) => s.resources.population.amount.gte(500) },
  { name: 'Tier I',   test: (s) => s.tier >= 1 },
  { name: 'Tier II',  test: (s) => s.tier >= 2 },
  { name: 'fin (II)', test: (s) => s.tier >= 3 },
];

// Fenêtres de durée souhaitées [min, max] en secondes (DRAFT — c'est ça qu'on cale).
const TARGETS: Record<string, [number, number]> = {
  // pop 25 / bande = phase de FONDATION, liée au clic (un joueur actif fonde plus vite : la borne
  // basse n'est tenue que par le profil le moins actif — c'est voulu).
  'pop 25':   [20, 120],
  bande:      [20, 180],
  'pop 60':   [120, 480],
  ferme:      [150, 480],
  'pop 250':  [420, 1200],
  'pop 500':  [900, 2400],
  'Tier I':   [3600, 10800],
  'Tier II':  [10800, 36000],
  'fin (II)': [14400, 54000],
};

// ----------------------------------------------------------------------------------------------
// Bot d'achat générique (greedy, avec réserve de Vivres pour ne pas se faminer)
// ----------------------------------------------------------------------------------------------
function affordableKeepingFood(state: GameState, cost: Partial<Record<ResourceId, Decimal>>, reserve: Decimal): boolean {
  if (!canAfford(state, cost)) return false;
  const foodCost = cost.food;
  if (foodCost && state.resources.food.amount.sub(foodCost).lt(reserve)) return false;
  return true;
}

function buyStep(state: GameState, profile: Profile): GameState {
  // Allocation : dès qu'elle est pertinente (pop ≥ 250), viser la part de Labeur du profil.
  if (state.resources.population.amount.gte(250)) {
    const labor = Math.max(0, Math.min(10, Math.round(profile.laborShare * 10)));
    state = { ...state, allocation: { forage: 10 - labor, labor } };
  }

  const reserve = rates(state).foodConsumption.mul(FOOD_RESERVE_SEC);

  let bought = true;
  let guard = 0;
  while (bought && guard++ < 1000) {
    bought = false;
    for (const g of GENERATORS) {
      if (!state.discovered[g.id] || !isUnlocked(state, g.unlock)) continue;
      const cost = generatorBatchCost(g, state.owned[g.id] ?? 0, state.buyQuantity);
      if (!affordableKeepingFood(state, cost, reserve)) continue;
      const next = applyBuyGenerator(state, g.id);
      if (next !== state) { state = next; bought = true; }
    }
    for (const t of TECHS) {
      if (!state.discovered[t.id] || state.purchased[t.id]) continue;
      const next = applyBuyTech(state, t.id);
      if (next !== state) { state = next; bought = true; }
    }
    for (const u of UPGRADES) {
      if (!state.discovered[u.id] || state.purchased[u.id]) continue;
      const next = applyBuyUpgrade(state, u.id);
      if (next !== state) { state = next; bought = true; }
    }
  }
  return state;
}

// ----------------------------------------------------------------------------------------------
// Simulation d'une partie
// ----------------------------------------------------------------------------------------------
interface RunResult {
  reached: Record<string, number | undefined>;
  finalPop: Decimal;
  finalTier: number;
  duration: number;
}

function simulate(profile: Profile, seed: number): RunResult {
  let state = initialState();
  const rng = createRng(seed);
  const reached: Record<string, number | undefined> = {};
  let t = 0;
  let clickAcc = 0;
  let decisionAcc = 0;

  while (t < MAX_GAME_SECONDS) {
    // Clics : on fonde à la main, puis on AUTOMATISE et on arrête de spammer (un joueur réel ne
    // clique pas en continu une fois l'autoclicker acquis). → le clic ne pèse que sur la fondation.
    const automated = (state.owned['hunting_band'] ?? 0) >= 1;
    if (!automated && clickRegime(state) === 'bootstrap') {
      const jit = 1 + (rng.next() * 2 - 1) * profile.jitter;
      clickAcc += profile.clicksPerSec * FIXED * Math.max(0, jit);
      while (clickAcc >= 1) {
        state = applyClick(state);
        clickAcc -= 1;
      }
    }

    // Décisions d'achat à la cadence du profil.
    decisionAcc += FIXED;
    if (decisionAcc >= profile.decisionEverySec) {
      decisionAcc = 0;
      state = buyStep(state, profile);
    }

    state = step(state, FIXED);
    t += FIXED;

    for (const m of MILESTONES) {
      if (reached[m.name] === undefined && m.test(state)) reached[m.name] = t;
    }
    if (reached['fin (II)'] !== undefined) break;
  }

  return {
    reached,
    finalPop: state.resources.population.amount,
    finalTier: state.tier,
    duration: t,
  };
}

// ----------------------------------------------------------------------------------------------
// Rapport
// ----------------------------------------------------------------------------------------------
function fmtTime(s: number | undefined): string {
  if (s === undefined) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m${String(sec).padStart(2, '0')}s` : `${sec}s`;
}

function statusOf(name: string, t: number | undefined): string {
  const win = TARGETS[name];
  if (!win) return '';
  if (t === undefined) return 'UNREACHED';
  if (t < win[0]) return 'RAPIDE';
  if (t > win[1]) return 'LENT';
  return 'ok';
}

let failures = 0;

console.log(`\nBanc de simulation — ${MILESTONES.length} jalons, ${PROFILES.length} profils, max ${MAX_GAME_SECONDS / 60} min/partie\n`);

for (let i = 0; i < PROFILES.length; i++) {
  const profile = PROFILES[i];
  const res = simulate(profile, SEED + i);
  console.log(
    `── ${profile.name}  (clic ${profile.clicksPerSec}/s, jitter ${profile.jitter}, ` +
      `décision /${profile.decisionEverySec}s, labeur ${Math.round(profile.laborShare * 100)}%)`,
  );
  console.log(`   final : pop ${res.finalPop.floor().toString()}, tier ${res.finalTier}, ${fmtTime(res.duration)}`);
  for (const m of MILESTONES) {
    const t = res.reached[m.name];
    const win = TARGETS[m.name];
    const st = statusOf(m.name, t);
    if (st !== 'ok' && st !== '') failures++;
    const target = win ? `cible ${fmtTime(win[0])}–${fmtTime(win[1])}` : '';
    console.log(
      `   ${m.name.padEnd(10)} ${fmtTime(t).padStart(8)}   ${target.padEnd(22)} ${st !== 'ok' ? `« ${st} »` : ''}`,
    );
  }
  console.log('');
}

console.log(`Hors cible : ${failures} (sur ${PROFILES.length * Object.keys(TARGETS).length}).\n`);

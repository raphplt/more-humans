/*
 * Banc de simulation d'équilibrage — More Humans (Âge 0 : le couteau malthusien).
 *
 * Rejoue le VRAI moteur (model/engine + model/actions, partagés avec le jeu) sans UI. Deux rôles :
 *   1. PACING (S1) — des profils de joueurs atteignent les jalons de l'Âge 0 dans des fenêtres-cibles.
 *   2. ÂME (S2/S3/S5) — assertions ANTI-IDLE-LISSE qui font ÉCHOUER le process (exit 1) :
 *        S2  une stratégie tout-Croissance SUBIT une famine (P décroît) en ≤ 5 min ;
 *        S3  un pilotage fin BAT les deux extrêmes (tout-Croissance / tout-Capacité) en pop finale ;
 *        S5  après une famine, basculer sur la Capacité fait REPARTIR la population.
 *
 * Lancer :  npm run sim
 *
 * NB : la rampe industrielle (Matière → énergie → Tier I+) est l'objet du jalon M4 (cf. 06). Tant
 * qu'elle n'est pas branchée, les jalons Tier I+ sont marqués « différé » (non comptés).
 */
import Decimal from 'break_infinity.js';
import type { GameState, ResourceId } from '../src/model/types';
import { clickRegime, computeFlows, step } from '../src/model/engine';
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
const MAX_GAME_SECONDS = 30 * 60; // Âge 0 : 30 min suffisent (la rampe industrielle = M4)
const SEED = 12345;

const num = (d: Decimal) => d.toNumber();

// ----------------------------------------------------------------------------------------------
// Le curseur (politiques d'allocation Croissance ↔ Capacité)
// ----------------------------------------------------------------------------------------------
/** Part « capacité » du curseur, en %. 0 = tout Croissance, 100 = tout Capacité. */
type Curseur = (s: GameState) => number;

const allGrowth: Curseur = () => 0;
const allCapacity: Curseur = () => 100;

/**
 * Pilotage fin : ANTICIPER le plafond. On garde Cap_sustain DEVANT la pop — plus on s'approche du
 * plafond, plus on bascule vers la Capacité ; loin du plafond, on convertit en Croissance. Un fond
 * de défrichage permanent évite de se faire rattraper.
 */
const piloted: Curseur = (s) => {
  const cap = num(computeFlows(s).capacity);
  const pop = num(s.resources.population.amount);
  if (cap <= 0) return 100;
  const ratio = pop / cap;
  const share = (ratio - 0.45) * 220; // contrôle proportionnel autour d'une marge ~0.45
  return Math.max(20, Math.min(100, Math.round(share)));
};

function setCurseur(s: GameState, capacityShare: number): GameState {
  const cap = Math.max(0, Math.min(100, capacityShare));
  return { ...s, allocation: { growth: 100 - cap, capacity: cap } };
}

// ----------------------------------------------------------------------------------------------
// Le bot d'achat (greedy, avec réserve de Vivres optionnelle)
// ----------------------------------------------------------------------------------------------
function affordableKeepingFood(
  state: GameState,
  cost: Partial<Record<ResourceId, Decimal>>,
  reserve: Decimal,
): boolean {
  if (!canAfford(state, cost)) return false;
  const foodCost = cost.food;
  if (foodCost && state.resources.food.amount.sub(foodCost).lt(reserve)) return false;
  return true;
}

/** Achète tout ce qui est révélé/débloqué/payable, en gardant `reserveSec` de Vivres en réserve. */
function buyStep(state: GameState, reserveSec: number): GameState {
  const reserve = computeFlows(state).foodConsumption.mul(reserveSec);
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
      if (!state.discovered[u.id]) continue;
      const next = applyBuyUpgrade(state, u.id);
      if (next !== state) { state = next; bought = true; }
    }
  }
  return state;
}

// ----------------------------------------------------------------------------------------------
// Un bot = une cadence de clic + une politique de curseur + une discipline de Vivres
// ----------------------------------------------------------------------------------------------
interface Bot {
  name: string;
  clicksPerSec: number;
  jitter: number;
  decisionEverySec: number;
  curseur: Curseur;
  foodReserveSec: number; // 0 = imprudent (se famine)
  // bascule de reprise : à la 1ʳᵉ famine, on force le curseur sur la Capacité (S5)
  recoverOnFamine?: boolean;
}

interface RunResult {
  reached: Record<string, number | undefined>;
  finalPop: Decimal;
  finalTier: number;
  duration: number;
  firstFamine: number | undefined; // 1ᵉʳ tick où P décroît
  peakBeforeFamine: number; // pic de pop atteint avant la 1ʳᵉ famine
  minAfterFamine: number; // creux de pop après la famine (plancher)
  reprise: number | undefined; // 1ᵉʳ instant où P repasse son pic d'avant-famine
}

function simulate(bot: Bot, seed: number, maxSeconds = MAX_GAME_SECONDS): RunResult {
  let state = initialState();
  const rng = createRng(seed);
  const reached: Record<string, number | undefined> = {};
  let t = 0;
  let clickAcc = 0;
  let decisionAcc = 0;

  let prevPop = num(state.resources.population.amount);
  let firstFamine: number | undefined;
  let peakBeforeFamine = 0;
  let minAfterFamine = Infinity;
  let reprise: number | undefined;
  let recovering = false;

  while (t < maxSeconds) {
    // Clics de fondation : on amorce à la main, puis la bande automatise (un joueur réel cesse de
    // spammer une fois l'autoclicker acquis).
    const automated = (state.owned['hunting_band'] ?? 0) >= 1;
    if (!automated && clickRegime(state) === 'bootstrap') {
      const jit = 1 + (rng.next() * 2 - 1) * bot.jitter;
      clickAcc += bot.clicksPerSec * FIXED * Math.max(0, jit);
      while (clickAcc >= 1) {
        state = applyClick(state);
        clickAcc -= 1;
      }
    }

    // Curseur (politique du bot, ou bascule de reprise après famine).
    const share = recovering ? 100 : bot.curseur(state);
    state = setCurseur(state, share);

    // Décisions d'achat à la cadence du bot.
    decisionAcc += FIXED;
    if (decisionAcc >= bot.decisionEverySec) {
      decisionAcc = 0;
      state = buyStep(state, bot.foodReserveSec);
    }

    state = step(state, FIXED);
    t += FIXED;

    // Suivi famine / reprise.
    const pop = num(state.resources.population.amount);
    if (firstFamine === undefined) {
      peakBeforeFamine = Math.max(peakBeforeFamine, pop);
      if (pop < prevPop - 1e-9) {
        firstFamine = t;
        if (bot.recoverOnFamine) recovering = true;
      }
    } else {
      minAfterFamine = Math.min(minAfterFamine, pop);
      if (reprise === undefined && pop >= peakBeforeFamine) reprise = t;
    }
    prevPop = pop;

    for (const m of MILESTONES) {
      if (reached[m.name] === undefined && m.test(state)) reached[m.name] = t;
    }
  }

  return {
    reached,
    finalPop: state.resources.population.amount,
    finalTier: state.tier,
    duration: t,
    firstFamine,
    peakBeforeFamine,
    minAfterFamine: minAfterFamine === Infinity ? peakBeforeFamine : minAfterFamine,
    reprise,
  };
}

// ----------------------------------------------------------------------------------------------
// Jalons & fenêtres-cibles (Âge 0). Cf. 05 §3. Les jalons Tier I+ sont DIFFÉRÉS (rampe = M4).
// ----------------------------------------------------------------------------------------------
interface Milestone {
  name: string;
  test: (s: GameState) => boolean;
}

const MILESTONES: Milestone[] = [
  { name: 'pop 25', test: (s) => s.resources.population.amount.gte(25) },
  { name: 'bande', test: (s) => (s.owned['hunting_band'] ?? 0) >= 1 },
  { name: 'pop 60', test: (s) => s.resources.population.amount.gte(60) },
  { name: 'agriculture', test: (s) => s.purchased['agriculture'] === true },
  { name: 'pop 250', test: (s) => s.resources.population.amount.gte(250) },
  { name: 'pop 500', test: (s) => s.resources.population.amount.gte(500) },
];

// Fenêtres [min, max] en secondes (DRAFT — c'est ça qu'on cale au banc).
const TARGETS: Record<string, [number, number]> = {
  'pop 25': [20, 180],
  bande: [20, 240],
  'pop 60': [60, 600],
  agriculture: [120, 900],
  'pop 250': [240, 1500],
  'pop 500': [420, 1800],
};

// ----------------------------------------------------------------------------------------------
// Profils de pacing (S1) — des joueurs « raisonnables » (curseur piloté), plus ou moins actifs.
// ----------------------------------------------------------------------------------------------
const PROFILES: Bot[] = [
  { name: 'Idle',       clicksPerSec: 0.3, jitter: 0.8, decisionEverySec: 15, curseur: piloted, foodReserveSec: 5 },
  { name: 'Tranquille', clicksPerSec: 1,   jitter: 0.5, decisionEverySec: 5,  curseur: piloted, foodReserveSec: 5 },
  { name: 'Régulier',   clicksPerSec: 3,   jitter: 0.2, decisionEverySec: 2,  curseur: piloted, foodReserveSec: 5 },
  { name: 'Acharné',    clicksPerSec: 8,   jitter: 0.3, decisionEverySec: 1,  curseur: piloted, foodReserveSec: 5 },
];

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

// On compte comme HORS-CIBLE (gating) seulement les STALLS : LENT / UNREACHED. Le « RAPIDE » est
// attendu — un joueur actif fonde et croît plus vite (cf. note TARGETS, 05 §3). Le plafond de
// l'explosion exponentielle tardive sera posé par la rampe énergie (M4), pas ici.
let pacingStalls = 0;
let pacingRapide = 0;
const PACING_TOL = 2; // S1 : « stalls ≤ tol »

console.log(`\n━━ Banc Âge 0 — pacing (S1) ━━  ${PROFILES.length} profils, max ${MAX_GAME_SECONDS / 60} min\n`);
for (let i = 0; i < PROFILES.length; i++) {
  const bot = PROFILES[i];
  const res = simulate(bot, SEED + i);
  console.log(`── ${bot.name}  (clic ${bot.clicksPerSec}/s, décision /${bot.decisionEverySec}s)`);
  console.log(`   final : pop ${res.finalPop.floor().toString()}, ${fmtTime(res.duration)}`);
  for (const m of MILESTONES) {
    const t = res.reached[m.name];
    const st = statusOf(m.name, t);
    if (st === 'LENT' || st === 'UNREACHED') pacingStalls++;
    if (st === 'RAPIDE') pacingRapide++;
    const win = TARGETS[m.name];
    const target = win ? `cible ${fmtTime(win[0])}–${fmtTime(win[1])}` : '';
    console.log(
      `   ${m.name.padEnd(12)} ${fmtTime(t).padStart(8)}   ${target.padEnd(22)} ${st !== 'ok' ? `« ${st} »` : ''}`,
    );
  }
  console.log('');
}
console.log(`Pacing — stalls (LENT/UNREACHED) : ${pacingStalls} (tol ${PACING_TOL}) ; rapides (attendus) : ${pacingRapide}.`);

// ----------------------------------------------------------------------------------------------
// Assertions d'ÂME (S2/S3/S5) — font échouer le process (exit 1). Cf. 03 §2.
// ----------------------------------------------------------------------------------------------
const assertions: { id: string; ok: boolean; detail: string }[] = [];
function assert(id: string, ok: boolean, detail: string) {
  assertions.push({ id, ok, detail });
}

// S2 — Le « pousser tout » se paie : famine atteignable en ≤ 5 min.
{
  const naive: Bot = {
    name: 'Naïf (tout-Croissance)',
    clicksPerSec: 3, jitter: 0.2, decisionEverySec: 2,
    curseur: allGrowth, foodReserveSec: 0,
  };
  const r = simulate(naive, SEED + 100, 10 * 60);
  const ok = r.firstFamine !== undefined && r.firstFamine <= 5 * 60;
  assert('S2', ok, `famine à ${fmtTime(r.firstFamine)} (cible ≤ 5min), pic ${Math.round(r.peakBeforeFamine)}`);
}

// S3 — Le pilotage fin BAT les deux extrêmes en pop finale (≥ +20 %) sur 15 min.
{
  const horizon = 15 * 60;
  const mk = (name: string, curseur: Curseur): Bot => ({
    name, clicksPerSec: 3, jitter: 0.2, decisionEverySec: 2, curseur, foodReserveSec: 12,
  });
  const g = simulate(mk('tout-Croissance', allGrowth), SEED + 200, horizon);
  const c = simulate(mk('tout-Capacité', allCapacity), SEED + 201, horizon);
  const p = simulate(mk('piloté', piloted), SEED + 202, horizon);
  const best = Math.max(num(g.finalPop), num(c.finalPop));
  const ratio = num(p.finalPop) / Math.max(1, best);
  assert(
    'S3',
    ratio >= 1.2,
    `piloté ${Math.round(num(p.finalPop))} vs croissance ${Math.round(num(g.finalPop))} / ` +
      `capacité ${Math.round(num(c.finalPop))} → ×${ratio.toFixed(2)} (cible ≥ ×1.20)`,
  );
}

// S5 — Reprise après famine : basculer sur la Capacité fait repasser le pic d'avant-famine.
{
  const recov: Bot = {
    name: 'Reprise',
    clicksPerSec: 3, jitter: 0.2, decisionEverySec: 2,
    curseur: allGrowth, foodReserveSec: 0, recoverOnFamine: true,
  };
  const r = simulate(recov, SEED + 300, 20 * 60);
  const repr = r.firstFamine !== undefined && r.reprise !== undefined;
  const floorOk = r.minAfterFamine > 0; // jamais zéro (pas de spirale de mort)
  const delay = repr ? (r.reprise as number) - (r.firstFamine as number) : undefined;
  assert(
    'S5',
    repr && floorOk,
    `famine ${fmtTime(r.firstFamine)} → reprise ${fmtTime(r.reprise)} (Δ ${fmtTime(delay)}), plancher ${Math.round(r.minAfterFamine)}`,
  );
}

console.log(`\n━━ Assertions d'âme (S2/S3/S5) ━━\n`);
let soulFailures = 0;
for (const a of assertions) {
  if (!a.ok) soulFailures++;
  console.log(`   ${a.ok ? '✓' : '✗'} ${a.id}  ${a.detail}`);
}

const pacingOk = pacingStalls <= PACING_TOL;
console.log(
  `\nRésultat : âme ${soulFailures === 0 ? 'OK' : `${soulFailures} ÉCHEC(S)`}, ` +
    `pacing ${pacingOk ? 'OK' : `${pacingStalls} stalls (> tol ${PACING_TOL})`}.\n`,
);

if (soulFailures > 0 || !pacingOk) process.exit(1);

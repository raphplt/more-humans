// Boucle de jeu à pas fixe, HORS de React. Cf. 01_ARCHITECTURE §2 règles 2-3.
// Accumule le dt réel et simule par pas fixes → indépendant du framerate, et la
// progression hors-ligne = rejouer N pas d'un coup (plafonnés).

export const FIXED_STEP_S = 0.1; // 100 ms
const MAX_STEPS_PER_FRAME = 5; // anti-"spiral of death" si l'onglet a lagué

export type StepFn = (dtSeconds: number) => void;

let rafId: number | null = null;
let accumulator = 0;
let lastTime = 0;

/** Démarre la boucle ; `onStep` est appelé une fois par pas fixe. Renvoie une fonction d'arrêt. */
export function startLoop(onStep: StepFn): () => void {
  stopLoop();
  lastTime = performance.now();
  accumulator = 0;

  const frame = (t: number): void => {
    const frameDt = (t - lastTime) / 1000;
    lastTime = t;
    accumulator += frameDt;

    let steps = 0;
    while (accumulator >= FIXED_STEP_S && steps < MAX_STEPS_PER_FRAME) {
      onStep(FIXED_STEP_S);
      accumulator -= FIXED_STEP_S;
      steps++;
    }
    // Si on a saturé le budget de pas, on jette le retard accumulé.
    if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;

    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);
  return stopLoop;
}

export function stopLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/** Rejoue `elapsedMs` (plafonné en amont) par pas fixes — pour la progression hors-ligne. */
export function simulateElapsed(elapsedMs: number, onStep: StepFn): number {
  let remaining = elapsedMs / 1000;
  let steps = 0;
  while (remaining >= FIXED_STEP_S) {
    onStep(FIXED_STEP_S);
    remaining -= FIXED_STEP_S;
    steps++;
  }
  return steps;
}

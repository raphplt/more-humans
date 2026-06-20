// Horloge & progression hors-ligne. Cf. 01_ARCHITECTURE §5.

export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000; // plafond : 8 h

export function now(): number {
  return Date.now();
}

/** Temps écoulé depuis la dernière sauvegarde, PLAFONNÉ (sinon une longue absence fait exploser la boucle). */
export function offlineElapsedMs(lastSaved: number, cap: number = OFFLINE_CAP_MS): number {
  const elapsed = now() - lastSaved;
  if (elapsed <= 0) return 0;
  return Math.min(elapsed, cap);
}

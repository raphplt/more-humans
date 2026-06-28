import Decimal from 'break_infinity.js';
import type { GameState, ResourceId } from '../model/types';
import type { Flows } from '../model/engine';

// Temps estimé avant de pouvoir payer un coût, d'après les débits courants. Infini si une ressource
// requise ne progresse pas. L'énergie n'étant jamais un coût, on ne tombe que sur food/Matière/Savoir.
export function purchaseEtaSeconds(
  state: GameState,
  cost: Partial<Record<ResourceId, Decimal>>,
  flows: Flows,
): number {
  let worst = 0;
  for (const [res, amt] of Object.entries(cost) as [ResourceId, Decimal][]) {
    const have = state.resources[res].amount;
    if (have.gte(amt)) continue;
    const rate = flows[res];
    if (!rate || rate.lte(0)) return Infinity;
    worst = Math.max(worst, amt.sub(have).div(rate).toNumber());
  }
  return worst;
}

export function fmtEta(sec: number): string {
  if (!isFinite(sec)) return '—';
  if (sec < 1) return 'prêt';
  if (sec < 60) return `${Math.ceil(sec)} s`;
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.floor(sec / 3600)} h`;
}

import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { tierByLevel } from '../data/tiers.data';
import { minigameForTier } from '../minigames/registry';

// Zone de phase, à RÉVÉLATION. Pas de label « Tier X — Aube », pas de barre au démarrage : tout
// reste absent tant que ce n'est pas pertinent (cf. design-revelation-core). On révèle la
// progression Kardashev seulement quand le type devient significatif (≥ 10⁶ W), et on monte le
// mini-jeu du tier courant s'il y en a un (T0 = amorçage par le clic, donc aucun module ici).

const PROGRESS_VISIBLE = new Decimal('1e6');

export function PhaseView() {
  const tier = useStore((s) => s.tier);
  const energy = useStore((s) => s.resources.energy.amount);

  const threshold = tierByLevel(tier)?.energyThreshold;
  const showProgress = energy.gte(PROGRESS_VISIBLE) && !!threshold && threshold.gt(0);
  const pct = showProgress ? Math.min(100, energy.div(threshold).toNumber() * 100) : 0;

  const Minigame = minigameForTier(tier);

  if (!showProgress && !Minigame) return null;

  return (
    <section className="flex flex-col gap-4">
      {showProgress && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Vers {tierByLevel(tier + 1)?.name ?? 'les limites physiques'}</span>
            <span className="font-num tabular-nums">{Math.floor(pct)} %</span>
          </div>
          <div className="h-1 w-full bg-line">
            <div className="h-1 bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {Minigame && <Minigame />}
    </section>
  );
}

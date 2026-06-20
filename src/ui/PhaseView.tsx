import { useStore } from '../state/store';
import { tierByLevel } from '../data/tiers.data';
import { formatFull } from '../format/notation';
import { minigameForTier } from '../minigames/registry';

// Vue du tier courant : nom du tier, progression vers le seuil d'énergie suivant (rendue comme une
// graduation d'instrument), et le mini-jeu du tier (monté/démonté à la transition, cf. architecture §11).
export function PhaseView() {
  const tier = useStore((s) => s.tier);
  const energy = useStore((s) => s.resources.energy.amount);

  const current = tierByLevel(tier);
  const threshold = current?.energyThreshold;
  const pct =
    threshold && threshold.gt(0) ? Math.min(100, energy.div(threshold).toNumber() * 100) : 100;

  const Minigame = minigameForTier(tier);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-[0.15em] text-muted">
          Tier {tier} — {current?.name ?? '—'}
        </h2>
        <span className="font-num text-xs tabular-nums text-muted">
          {threshold ? `${formatFull(threshold)} W` : 'palier final'}
        </span>
      </div>

      <div className="h-1 w-full bg-line">
        <div className="h-1 bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>

      {Minigame && <Minigame />}
    </section>
  );
}

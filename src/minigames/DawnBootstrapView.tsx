import { useStore } from '../state/store';
import { BOOTSTRAP_DONE, clickRegime } from '../model/engine';
import { formatInt } from '../format/notation';

// Mini-jeu du Tier 0 : barre de progression de l'amorçage vers la masse critique. S'efface en
// régime drive (le geste devient du pilotage, géré par ClickTarget).
export function DawnBootstrapView() {
  const pop = useStore((s) => s.resources.population.amount);
  const regime = useStore(clickRegime);

  if (regime === 'drive') return null;

  const pct = Math.min(100, pop.div(BOOTSTRAP_DONE).toNumber() * 100);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>Premiers foyers</span>
        <span className="font-num tabular-nums">
          {formatInt(pop)} / {formatInt(BOOTSTRAP_DONE)}
        </span>
      </div>
      <div className="h-1 w-full bg-line">
        <div className="h-1 bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

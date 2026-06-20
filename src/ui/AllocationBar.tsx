import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';

// Profondeur DIFFÉRÉE (Temps 3) : répartir la population entre CUEILLETTE (Vivres) et LABEUR (Matière).
// N'apparaît qu'une fois la boucle de base maîtrisée — pas un système d'accueil. Plus de cueilleurs
// = croissance ; plus de laboureurs = Matière (ouvre la voie industrielle) mais risque de famine.
const ALLOC_REVEAL = new Decimal(250);

export function AllocationBar() {
  const pop = useStore((s) => s.resources.population.amount);
  const allocation = useStore((s) => s.allocation);
  const setAllocation = useStore((s) => s.setAllocation);

  if (pop.lt(ALLOC_REVEAL)) return null;

  const total = Math.max(1, allocation.forage + allocation.labor);
  const fPct = Math.round((allocation.forage / total) * 100);
  const lPct = 100 - fPct;

  const adjust = (key: 'forage' | 'labor', delta: number) => {
    const next = { ...allocation, [key]: Math.max(0, allocation[key] + delta) };
    if (next.forage + next.labor <= 0) return; // ne jamais tout mettre à zéro
    setAllocation(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => adjust('forage', 1)}
          className="rounded-base border border-line px-2 leading-none hover:text-accent"
          title="Plus de cueilleurs"
        >
          + Cueillette
        </button>
        <div className="flex h-1 flex-1 overflow-hidden bg-line">
          <div className="h-1 bg-accent transition-all" style={{ width: `${fPct}%` }} />
          <div className="h-1 bg-accent-soft transition-all" style={{ width: `${lPct}%` }} />
        </div>
        <button
          onClick={() => adjust('labor', 1)}
          className="rounded-base border border-line px-2 leading-none hover:text-accent"
          title="Plus de laboureurs"
        >
          Labeur +
        </button>
      </div>
      <div className="flex justify-between font-num text-xs tabular-nums text-muted">
        <span>Cueillette {fPct}%</span>
        <span>Labeur {lPct}%</span>
      </div>
    </div>
  );
}

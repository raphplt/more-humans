import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';

// Répartition de la population entre CUEILLETTE (Vivres) et LABEUR (Matière). Slider : pas de
// micro-management. N'apparaît qu'une fois la boucle de base maîtrisée.
const ALLOC_REVEAL = new Decimal(250);

export function AllocationBar() {
  const pop = useStore((s) => s.resources.population.amount);
  const allocation = useStore((s) => s.allocation);
  const setAllocation = useStore((s) => s.setAllocation);

  if (pop.lt(ALLOC_REVEAL)) return null;

  const total = Math.max(1, allocation.forage + allocation.labor);
  const laborPct = Math.round((allocation.labor / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs text-muted">
        Répartis ta population — Cueillette nourrit, Labeur produit la Matière.
      </p>
      <input
        type="range"
        min={0}
        max={100}
        value={laborPct}
        onChange={(e) => {
          const labor = Number(e.target.value);
          setAllocation({ forage: 100 - labor, labor });
        }}
        style={{ accentColor: 'var(--accent)' }}
        className="w-full"
      />
      <div className="flex justify-between font-num text-xs tabular-nums text-muted">
        <span>Cueillette {100 - laborPct}%</span>
        <span>Labeur {laborPct}%</span>
      </div>
    </div>
  );
}

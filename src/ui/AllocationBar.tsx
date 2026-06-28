import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';

// Le COUTEAU MALTHUSIEN : un seul curseur Croissance ↔ Capacité (cf. 02 §2). Croissance pousse les
// naissances maintenant ; Capacité défriche et relève le plafond nourricier. N'apparaît qu'au
// premier plafond ressenti (les Vivres cessent de monter).
const ALLOC_REVEAL = new Decimal(40);

export function AllocationBar() {
  const pop = useStore((s) => s.resources.population.amount);
  const allocation = useStore((s) => s.allocation);
  const setAllocation = useStore((s) => s.setAllocation);

  if (pop.lt(ALLOC_REVEAL)) return null;

  const total = Math.max(1, allocation.growth + allocation.capacity);
  const capacityPct = Math.round((allocation.capacity / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={capacityPct}
        onChange={(e) => {
          const capacity = Number(e.target.value);
          setAllocation({ growth: 100 - capacity, capacity });
        }}
        style={{ accentColor: 'var(--accent)' }}
        className="w-full"
      />
      <div className="flex justify-between font-num text-xs tabular-nums text-muted">
        <span>Croissance {100 - capacityPct}%</span>
        <span>Capacité {capacityPct}%</span>
      </div>
    </div>
  );
}

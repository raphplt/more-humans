import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { UPGRADES } from '../data/upgrades.data';
import { canAfford } from '../model/formulas';
import { isCulled } from '../model/culling';
import { formatFull, resourceLabel } from '../format/notation';
import { Discoverable } from './Discoverable';
import type { ResourceId } from '../model/types';

// Améliorations (achats uniques). Mêmes principes : lignes minimales, révélation, culling.
export function UpgradeList() {
  const s = useStore();
  const buy = useStore((st) => st.buyUpgrade);

  const list = UPGRADES.filter(
    (u) => !isCulled(u.tier, s.tier) && !s.purchased[u.id] && s.discovered[u.id],
  );
  if (list.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        {list.map((u) => {
          const affordable = canAfford(s, u.cost);
          return (
            <Discoverable key={u.id} id={u.id}>
              <button
                onClick={() => buy(u.id)}
                disabled={!affordable}
                title={u.description}
                className="flex w-full items-center justify-between gap-4 border-b border-line py-2 text-left transition enabled:hover:text-accent disabled:text-muted"
              >
                <span>{u.name}</span>
                <span className="font-num text-xs tabular-nums">
                  {(Object.entries(u.cost) as [ResourceId, Decimal][]).map(([res, amt], i) => (
                    <span key={res}>
                      {i > 0 && ' · '}
                      {formatFull(amt)} {resourceLabel(res)}
                    </span>
                  ))}
                </span>
              </button>
            </Discoverable>
          );
        })}
      </div>
    </section>
  );
}

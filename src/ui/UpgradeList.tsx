import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { UPGRADES } from '../data/upgrades.data';
import { canAfford, upgradeBatchCost } from '../model/formulas';
import { rates } from '../model/engine';
import { isCulled } from '../model/culling';
import { formatFull, resourceLabel } from '../format/notation';
import { fmtEta, purchaseEtaSeconds } from './affordability';
import { Discoverable } from './Discoverable';
import type { ResourceId, UpgradeDef } from '../model/types';

// Améliorations incrémentales : niveau · effet/niveau · coût croissant. Le clic actif se reporte ici.
function upgradeSummary(u: UpgradeDef): string {
  const parts: string[] = [];
  for (const e of u.effects) {
    if (e.kind === 'multiplyProduction') parts.push(`${resourceLabel(e.resource)} ×${e.factor}`);
    else if (e.kind === 'raiseCapacity') parts.push(`capacité ×${e.factor}`);
    else if (e.kind === 'raiseFoodCeiling') parts.push(`+${e.amount} capacité`);
    else if (e.kind === 'multiplyClick') parts.push(`clic ×${e.factor}`);
  }
  return parts.length ? `${parts.join(' · ')} / niv.` : '';
}

export function UpgradeList() {
  const s = useStore();
  const buy = useStore((st) => st.buyUpgrade);

  const list = UPGRADES.filter((u) => !isCulled(u.tier, s.tier) && s.discovered[u.id]);
  if (list.length === 0) return null;
  const flows = rates(s);

  return (
    <section className="flex flex-col">
      {list.map((u) => {
        const level = s.upgradeLevels[u.id] ?? 0;
        const maxed = u.maxLevel !== undefined && level >= u.maxLevel;
        const cost = upgradeBatchCost(u, level, s.buyQuantity);
        const affordable = !maxed && canAfford(s, cost);
        const eta = maxed || affordable ? 0 : purchaseEtaSeconds(s, cost, flows);
        return (
          <Discoverable key={u.id} id={u.id}>
            <button
              onClick={() => buy(u.id)}
              disabled={!affordable}
              title={u.description}
              className="flex w-full items-center justify-between gap-4 border-b border-line py-2 text-left transition enabled:hover:text-accent disabled:text-muted"
            >
              <span className="flex flex-col">
                <span>
                  {u.name}
                  {level > 0 && <span className="ml-2 text-accent">niv. {level}</span>}
                </span>
                <span className="font-num text-xs tabular-nums text-muted">{upgradeSummary(u)}</span>
              </span>
              <span className={`shrink-0 font-num text-xs tabular-nums ${affordable ? 'text-positive' : ''}`}>
                {maxed ? (
                  'max'
                ) : (
                  <>
                    {(Object.entries(cost) as [ResourceId, Decimal][]).map(([res, amt], i) => (
                      <span key={res}>
                        {i > 0 && ' · '}
                        {formatFull(amt)} {resourceLabel(res)}
                      </span>
                    ))}
                    {!affordable && <span className="ml-2 opacity-70">· {fmtEta(eta)}</span>}
                  </>
                )}
              </span>
            </button>
          </Discoverable>
        );
      })}
    </section>
  );
}

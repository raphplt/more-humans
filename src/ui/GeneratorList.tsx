import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { canAfford, generatorBatchCost } from '../model/formulas';
import { rates } from '../model/engine';
import { activeGenerators, culledProduction } from '../model/culling';
import { formatFull, resourceLabel } from '../format/notation';
import { fmtEta, purchaseEtaSeconds } from './affordability';
import { Discoverable } from './Discoverable';
import { BuyQuantitySelector } from './BuyQuantitySelector';
import type { GeneratorDef, ResourceId } from '../model/types';

// Listes minimales (cf. 04_art_direction §4) : nom · production · coût · action. Éléments non
// découverts ABSENTS ; éléments cull-és repliés.

function perUnit(amt: Decimal): string {
  const n = amt.toNumber();
  if (n < 10) {
    const r = Math.round(n * 100) / 100;
    const s = Number.isInteger(r) ? r.toString() : r.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }
  return formatFull(amt);
}

function producesSummary(g: GeneratorDef): string {
  const parts: string[] = [];
  for (const [res, amt] of Object.entries(g.produces) as [ResourceId, Decimal][]) {
    parts.push(`+${perUnit(amt)} ${resourceLabel(res)}/s`);
  }
  for (const e of g.effects ?? []) {
    if (e.kind === 'raiseFoodCeiling') parts.push(`+${e.amount} capacité`);
    else if (e.kind === 'raiseCapacity') parts.push(`capacité ×${e.factor}`);
  }
  return parts.join(' · ');
}
export function GeneratorList() {
  const s = useStore();
  const buy = useStore((st) => st.buyGenerator);

  const list = activeGenerators(s).filter((g) => s.discovered[g.id]);
  const flows = rates(s);
  const rente = culledProduction(s);
  const renteEntries = Object.entries(rente) as [ResourceId, Decimal][];

  // Révélation : tant qu'aucun générateur n'est découvert, la section n'existe pas (ni titre).
  if (list.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex justify-end">
        <BuyQuantitySelector />
      </div>

      <div className="flex flex-col">
        {list.map((g) => {
          const owned = s.owned[g.id] ?? 0;
          const cost = generatorBatchCost(g, owned, s.buyQuantity);
          const affordable = canAfford(s, cost);
          const eta = affordable ? 0 : purchaseEtaSeconds(s, cost, flows);
          return (
            <Discoverable key={g.id} id={g.id}>
              <button
                onClick={() => buy(g.id)}
                disabled={!affordable}
                title={g.description}
                className="flex w-full items-center justify-between gap-4 border-b border-line py-2 text-left transition enabled:hover:text-accent disabled:text-muted"
              >
                <span className="flex flex-col">
                  <span>
                    {g.name}
                    {owned > 0 && <span className="ml-2 text-muted">×{owned}</span>}
                  </span>
                  <span className="font-num text-xs tabular-nums text-muted">{producesSummary(g)}</span>
                </span>
                <span className={`shrink-0 font-num text-xs tabular-nums ${affordable ? 'text-positive' : ''}`}>
                  {(Object.entries(cost) as [ResourceId, Decimal][]).map(([res, amt], i) => (
                    <span key={res}>
                      {i > 0 && ' · '}
                      {formatFull(amt)} {resourceLabel(res)}
                    </span>
                  ))}
                  {!affordable && <span className="ml-2 opacity-70">· {fmtEta(eta)}</span>}
                </span>
              </button>
            </Discoverable>
          );
        })}
      </div>

      {renteEntries.length > 0 && (
        <div className="text-xs text-muted">
          Ères repliées :{' '}
          {renteEntries.map(([res, amt], i) => (
            <span key={res} className="font-num tabular-nums">
              {i > 0 && ' · '}+{formatFull(amt)} {resourceLabel(res)}/s
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

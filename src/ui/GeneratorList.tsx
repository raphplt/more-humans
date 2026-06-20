import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { canAfford, generatorBatchCost } from '../model/formulas';
import { activeGenerators, culledProduction } from '../model/culling';
import { formatFull, resourceLabel } from '../format/notation';
import { Discoverable } from './Discoverable';
import { BuyQuantitySelector } from './BuyQuantitySelector';
import type { ResourceId } from '../model/types';

// Listes minimales (cf. 04_art_direction §4) : nom · coût · action. Pas de description permanente
// (détail à la demande via survol). Éléments non découverts ABSENTS ; éléments cull-és repliés.
export function GeneratorList() {
  const s = useStore();
  const buy = useStore((st) => st.buyGenerator);

  const list = activeGenerators(s).filter((g) => s.discovered[g.id]);
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
          return (
            <Discoverable key={g.id} id={g.id}>
              <button
                onClick={() => buy(g.id)}
                disabled={!affordable}
                title={g.description}
                className="flex w-full items-center justify-between gap-4 border-b border-line py-2 text-left transition enabled:hover:text-accent disabled:text-muted"
              >
                <span>
                  {g.name}
                  {owned > 0 && <span className="ml-2 text-muted">×{owned}</span>}
                </span>
                <span className="font-num text-xs tabular-nums">
                  {(Object.entries(cost) as [ResourceId, Decimal][]).map(([res, amt], i) => (
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

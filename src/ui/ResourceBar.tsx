import Decimal from 'break_infinity.js';
import { useStore } from '../state/store';
import { rates } from '../model/engine';
import { formatInt, kardashevLabel, resourceLabel } from '../format/notation';

// En-tête à RÉVÉLATION (cf. design-revelation-core). « 0 Humains » est affiché dès le départ pour
// éviter un saut de mise en page ; les autres métriques APPARAISSENT quand elles deviennent
// pertinentes. Chaque métrique montre son STOCK et son DÉBIT (+X/s), arrondis à l'entier.

const KARDASHEV_VISIBLE = new Decimal('1e6'); // sous 10⁶ W le type de Sagan est négatif → caché
const FOOD_VISIBLE = new Decimal(25); // les Vivres n'apparaissent qu'au 1er palier (Temps 1)

/** Débit signé arrondi, ex. "+3/s" / "−2/s". */
function rate(perSec: Decimal): { text: string; negative: boolean } {
  const negative = perSec.lt(0);
  const n = perSec.abs().round();
  return { text: `${negative ? '−' : '+'}${formatInt(n)}/s`, negative };
}

function Metric({ value, perSec, label, invert }: { value: string; perSec: Decimal; label: string; invert?: boolean }) {
  const r = rate(perSec);
  return (
    <span className="font-num tabular-nums">
      {value} {label}
      <span className={`ml-1 text-xs ${invert && r.negative ? 'text-warn' : 'text-muted'}`}>{r.text}</span>
    </span>
  );
}

export function ResourceBar() {
  // On s'abonne aux stocks (refs fraîches à chaque tick → re-render), puis on calcule les débits
  // à partir de l'état courant. NE PAS faire `useStore(rates)` : rates() crée un nouvel objet à
  // chaque appel → boucle infinie de useSyncExternalStore (Zustand v5).
  const pop = useStore((s) => s.resources.population.amount);
  const food = useStore((s) => s.resources.food.amount);
  const matter = useStore((s) => s.resources.resources.amount);
  const knowledge = useStore((s) => s.resources.knowledge.amount);
  const energy = useStore((s) => s.resources.energy.amount);
  const flows = rates(useStore.getState());

  const showType = energy.gte(KARDASHEV_VISIBLE);

  return (
    <header className="flex flex-col items-center gap-1 py-10 text-center">
      <div className="font-num text-5xl font-semibold tabular-nums text-fg">{formatInt(pop)}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted">
        Humains
        {flows.population.gt(0) && (
          <span className="ml-1 normal-case tracking-normal">{rate(flows.population).text}</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm text-muted">
        {pop.gte(FOOD_VISIBLE) && (
          <Metric value={formatInt(food)} perSec={flows.food} label="Vivres" invert />
        )}
        {matter.gte(1) && (
          <Metric value={formatInt(matter)} perSec={flows.resources} label={resourceLabel('resources')} />
        )}
        {knowledge.gte(1) && (
          <Metric value={formatInt(knowledge)} perSec={flows.knowledge} label={resourceLabel('knowledge')} />
        )}
        {energy.gte(1) && (
          <span className="font-num tabular-nums">
            {formatInt(energy)} W{showType && <span className="text-accent"> · {kardashevLabel(energy)}</span>}
          </span>
        )}
      </div>
    </header>
  );
}

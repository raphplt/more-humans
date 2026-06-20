import { useStore } from '../state/store';
import { formatInt, formatWatts } from '../format/notation';

// Fin provisoire de la v1 : franchir le Type II (énergie ≥ 3,8×10²⁶ W). Climax « tu as construit
// l'essaim de Dyson, l'humanité est devenue stellaire ». La suite (galactique → endgame entropie)
// est différée (cf. périmètre v1). Écran dismissable : on peut continuer à jouer.
export function EndScreen({ onDismiss }: { onDismiss: () => void }) {
  const population = useStore((s) => s.resources.population.amount);
  const energy = useStore((s) => s.resources.energy.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-accent">Civilisation de Type II</div>
        <h1 className="text-3xl font-semibold text-fg">L'humanité est devenue stellaire.</h1>
        <p className="text-sm text-muted">
          L'essaim de Dyson enserre le Soleil. Tu as porté l'humanité du premier feu jusqu'à la
          maîtrise d'une étoile entière.
        </p>

        <div className="flex flex-col gap-1 font-num tabular-nums">
          <div className="text-2xl text-fg">{formatInt(population)} Humains</div>
          <div className="text-sm text-muted">{formatWatts(energy)}</div>
        </div>

        <p className="text-xs text-muted">
          Fin de la v1. La suite — expansion galactique, virage post-biologique, et la course
          contre l'entropie jusqu'à la mort thermique — viendra.
        </p>

        <button
          onClick={onDismiss}
          className="rounded-base border border-accent px-4 py-2 text-sm text-accent transition hover:bg-accent hover:text-bg"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

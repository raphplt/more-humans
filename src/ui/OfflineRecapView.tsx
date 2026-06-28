import { useStore } from '../state/store';
import { formatInt } from '../format/notation';

function humanDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

// Bilan de retour : récompense ressentie de la progression hors-ligne (calcul déjà fait dans game.ts).
export function OfflineRecapView() {
  const recap = useStore((s) => s.offlineRecap);
  const dismiss = useStore((s) => s.setOfflineRecap);
  if (!recap) return null;

  return (
    <div
      onClick={() => dismiss(null)}
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/85 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-base border border-line bg-surface p-8 text-center"
      >
        <div className="text-xs uppercase tracking-[0.2em] text-muted">De retour</div>
        <div className="text-sm text-fg">Pendant ton absence ({humanDuration(recap.elapsedMs)})</div>
        <div className="font-num text-4xl font-semibold tabular-nums text-accent">
          +{formatInt(recap.populationGain)}
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Humains</div>
        <button
          onClick={() => dismiss(null)}
          className="mt-3 w-full rounded-base bg-accent py-2 font-semibold text-bg transition active:scale-[0.99]"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

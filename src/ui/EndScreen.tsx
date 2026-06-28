import { useStore } from '../state/store';
import { ACHIEVEMENTS } from '../data/achievements.data';
import { formatInt, formatWatts } from '../format/notation';

// Fin de la v1 : franchir le Type II (énergie ≥ 3,8×10²⁶ W). Climax « tu as bâti l'essaim de Dyson »,
// avec le bilan de la run. La suite (galactique → endgame entropie) est différée. Écran dismissable.
function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-num text-lg tabular-nums text-fg">{value}</span>
      <span className="text-xs uppercase tracking-[0.15em] text-muted">{label}</span>
    </div>
  );
}

export function EndScreen({ onDismiss }: { onDismiss: () => void }) {
  const population = useStore((s) => s.resources.population.amount);
  const energy = useStore((s) => s.resources.energy.amount);
  const playtimeMs = useStore((s) => s.playtimeMs);
  const totalClicks = useStore((s) => s.totalClicks);
  const achievements = useStore((s) => s.achievements);
  const unlocked = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

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

        <div className="grid w-full grid-cols-3 gap-4 border-t border-line pt-5">
          <Stat label="Temps" value={fmtDuration(playtimeMs)} />
          <Stat label="Clics" value={totalClicks.toLocaleString('fr-FR')} />
          <Stat label="Succès" value={`${unlocked}/${ACHIEVEMENTS.length}`} />
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

import { useStore } from '../state/store';
import { ACHIEVEMENTS } from '../data/achievements.data';
import { GENERATORS } from '../data/generators.data';
import { tierByLevel } from '../data/tiers.data';
import { formatInt } from '../format/notation';

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`;
  if (m > 0) return `${m} min ${String(sec).padStart(2, '0')} s`;
  return `${sec} s`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-num tabular-nums text-fg">{value}</span>
    </div>
  );
}

// Journal : statistiques de la run + succès (objectifs à atteindre = carotte court terme).
export function JournalView({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const generatorsOwned = GENERATORS.reduce((a, g) => a + (s.owned[g.id] ?? 0), 0);
  const unlocked = ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length;

  return (
    <div onClick={onClose} className="fixed inset-0 z-40 flex items-center justify-center bg-bg/85 p-6">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-base border border-line bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Journal</span>
          <button onClick={onClose} className="text-lg text-muted hover:text-fg">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <Row label="Temps de jeu" value={fmtDuration(s.playtimeMs)} />
          <Row label="Humains" value={formatInt(s.resources.population.amount)} />
          <Row label="Ère" value={tierByLevel(s.tier)?.name ?? '—'} />
          <Row label="Bâtiments" value={generatorsOwned.toLocaleString('fr-FR')} />
          <Row label="Clics" value={s.totalClicks.toLocaleString('fr-FR')} />
          <Row label="Succès" value={`${unlocked} / ${ACHIEVEMENTS.length}`} />
        </div>

        <div className="flex flex-col gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements[a.id];
            return (
              <div
                key={a.id}
                className={`flex flex-col rounded-base border px-3 py-2 ${got ? 'border-accent' : 'border-line opacity-60'}`}
              >
                <span className={got ? 'text-accent' : 'text-fg'}>{a.name}</span>
                <span className="text-xs text-muted">{a.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

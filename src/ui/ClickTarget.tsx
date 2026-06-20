import { useStore } from '../state/store';
import { clickRegime } from '../model/engine';
import { formatMult } from '../format/notation';
import type { DriveTarget } from '../model/types';

// Le clic a deux régimes (cf. 05_mechanics §1, claude.md règle 7) :
//  - amorçage (P≈0) : le clic CRÉE des Humains (spam +1 assumé, automatisé vite par l'autoclicker) ;
//  - pilotage : poussée stratégique allouée au goulot courant (plus de +1).
// La bascule est lisible : le bouton change de nature.

const TARGETS: { id: DriveTarget; label: string }[] = [
  { id: 'growth', label: 'Croissance' },
  { id: 'research', label: 'Recherche' },
  { id: 'construction', label: 'Construction' },
];

export function ClickTarget() {
  const regime = useStore(clickRegime);
  const drive = useStore((s) => s.drive);
  const target = useStore((s) => s.driveTarget);
  const click = useStore((s) => s.click);
  const setTarget = useStore((s) => s.setDriveTarget);

  if (regime === 'bootstrap') {
    return (
      <button
        onClick={click}
        className="w-full rounded-base bg-accent py-6 text-lg font-semibold text-bg transition active:scale-[0.99]"
      >
        Peupler
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={click}
        className="w-full rounded-base border border-accent py-5 text-base font-semibold text-accent transition hover:bg-accent hover:text-bg active:scale-[0.99]"
      >
        Pousser <span className="font-num tabular-nums">×{formatMult(drive.add(1))}</span>
      </button>
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-base border border-line">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTarget(t.id)}
            className={`py-2 text-xs transition ${
              target === t.id ? 'bg-accent-soft text-fg' : 'text-muted hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

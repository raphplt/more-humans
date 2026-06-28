import { useState } from 'react';
import { useStore } from '../state/store';
import { clickRegime } from '../model/engine';
import { formatInt } from '../format/notation';

// Clic d'amorçage : crée des Humains (« +N » flottant). Passé l'amorçage, le clic « monte d'un
// étage » vers les améliorations incrémentales (cf. UpgradeList) — plus de bouton global ici.
let popId = 0;

export function ClickTarget() {
  const regime = useStore(clickRegime);
  const clickPower = useStore((s) => s.clickPower);
  const click = useStore((s) => s.click);
  const [pops, setPops] = useState<{ id: number; x: number }[]>([]);

  if (regime !== 'bootstrap') return null;

  const onClick = () => {
    click();
    const id = popId++;
    setPops((p) => [...p, { id, x: 28 + Math.random() * 44 }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 750);
  };

  return (
    <div className="relative">
      {pops.map((p) => (
        <span
          key={p.id}
          style={{ left: `${p.x}%` }}
          className="float-pop pointer-events-none absolute top-1/2 z-10 font-num text-xl font-bold text-bg"
        >
          +{formatInt(clickPower)}
        </span>
      ))}
      <button
        onClick={onClick}
        className="w-full rounded-base bg-accent py-6 text-lg font-semibold text-bg transition active:scale-[0.97]"
      >
        Peupler
      </button>
    </div>
  );
}

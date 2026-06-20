import { useStore } from '../state/store';
import { formatBonusPct } from '../format/notation';
import {
  asDyson,
  dysonCapacityMultiplier,
  dysonEnergyMultiplier,
  energyShare,
} from './dysonYard';

// Mini-jeu du Tier II : le chantier orbital de l'essaim de Dyson (cf. 05_mechanics §3). Une seule
// décision : où porter l'effort de construction — collecteurs (énergie, vers le Type II) ou habitats
// (capacité, plus d'Humains hors-sol).
export function DysonYard() {
  const minigame = useStore((s) => s.minigame);
  const setMinigame = useStore((s) => s.setMinigame);

  const dyson = asDyson(minigame);
  const share = energyShare(dyson);
  const eMult = dysonEnergyMultiplier(dyson);
  const cMult = dysonCapacityMultiplier(dyson);

  const adjust = (delta: number) => {
    setMinigame({ energyFocus: Math.min(100, Math.max(0, dyson.energyFocus + delta)) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span>Chantier orbital — essaim de Dyson</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => adjust(-10)}
          className="rounded-base border border-line px-2 leading-none hover:text-accent"
        >
          ← Habitats
        </button>
        <div className="flex h-1 flex-1 overflow-hidden bg-line">
          <div className="h-1 bg-accent transition-all" style={{ width: `${share * 100}%` }} />
          <div
            className="h-1 bg-accent-soft transition-all"
            style={{ width: `${(1 - share) * 100}%` }}
          />
        </div>
        <button
          onClick={() => adjust(10)}
          className="rounded-base border border-line px-2 leading-none hover:text-accent"
        >
          Collecteurs →
        </button>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span className="font-num tabular-nums">capacité {formatBonusPct(cMult)}</span>
        <span className="font-num tabular-nums">énergie {formatBonusPct(eMult)}</span>
      </div>
    </div>
  );
}

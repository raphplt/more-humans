import { useStore } from '../state/store';
import { formatBonusPct } from '../format/notation';
import {
  asMix,
  energyMixMultiplier,
  mixShares,
  MIX_SOURCES,
  type MixSourceId,
} from './energyMix';

// Mini-jeu du Tier I : arbitrage du mix énergétique (cf. 05_mechanics §3). Une poignée de leviers,
// pas de micro-management. Les sources s'ajoutent au mix quand leur tech est acquise (révélation).
export function EnergyMixView() {
  const minigame = useStore((s) => s.minigame);
  const purchased = useStore((s) => s.purchased);
  const setMinigame = useStore((s) => s.setMinigame);

  const mix = asMix(minigame);
  const shares = mixShares(mix);
  const mult = energyMixMultiplier(mix);

  const sources = MIX_SOURCES.filter((s) => !s.requires || purchased[s.requires]);

  const adjust = (id: MixSourceId, delta: number) => {
    setMinigame({ ...mix, [id]: Math.max(0, mix[id] + delta) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span>Mix énergétique</span>
        <span className="font-num tabular-nums">rendement {formatBonusPct(mult)}</span>
      </div>
      <div className="flex flex-col gap-1">
        {sources.map((s) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <span className="w-28 text-fg">{s.name}</span>
            <div className="h-1 flex-1 bg-line">
              <div
                className="h-1 bg-accent transition-all"
                style={{ width: `${Math.round(shares[s.id] * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right font-num tabular-nums text-muted">
              {Math.round(shares[s.id] * 100)}%
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => adjust(s.id, -1)}
                className="rounded-base border border-line px-2 leading-none hover:text-accent"
              >
                −
              </button>
              <button
                onClick={() => adjust(s.id, 1)}
                className="rounded-base border border-line px-2 leading-none hover:text-accent"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

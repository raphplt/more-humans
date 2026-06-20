import { useStore } from '../state/store';
import type { BuyQuantity } from '../model/types';

// Sélecteur ×1/×10/×100 (cf. architecture §8). ×1 d'emblée ; ×10 et ×100 APPARAISSENT (jamais
// grisés) après un seuil d'achats/tier — révélation progressive. Seuils = draft.
export function BuyQuantitySelector() {
  const owned = useStore((s) => s.owned);
  const tier = useStore((s) => s.tier);
  const buyQuantity = useStore((s) => s.buyQuantity);
  const setBuyQuantity = useStore((s) => s.setBuyQuantity);

  const totalOwned = Object.values(owned).reduce((a, b) => a + b, 0);

  const options: BuyQuantity[] = [1];
  if (totalOwned >= 25 || tier >= 1) options.push(10);
  if (tier >= 2 || totalOwned >= 200) options.push(100);

  if (options.length === 1) return null; // tant que ×10 n'est pas révélé, pas de sélecteur

  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <span>Acheter</span>
      {options.map((q) => (
        <button
          key={q}
          onClick={() => setBuyQuantity(q)}
          className={`rounded-base px-2 py-0.5 transition ${
            buyQuantity === q ? 'bg-accent-soft text-fg' : 'hover:text-fg'
          }`}
        >
          ×{q}
        </button>
      ))}
    </div>
  );
}

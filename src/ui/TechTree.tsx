import { useStore } from '../state/store';
import { TECHS } from '../data/techs.data';
import { canAfford } from '../model/formulas';
import { isCulled } from '../model/culling';
import { formatFull } from '../format/notation';
import { Discoverable } from './Discoverable';

// Recherche : lignes minimales. Une tech n'est RÉVÉLÉE (cf. engine.computeDiscovered) qu'une fois
// ses prérequis remplis → pas besoin d'afficher les prérequis ni de griser quoi que ce soit.
export function TechTree() {
  const s = useStore();
  const buy = useStore((st) => st.buyTech);

  const list = TECHS.filter((t) => !isCulled(t.tier, s.tier) && s.discovered[t.id]);

  // Révélation : pas de section (ni titre) tant qu'aucune recherche n'est découverte.
  if (list.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col">
        {list.map((t) => {
          const purchased = s.purchased[t.id] === true;
          const affordable = canAfford(s, t.cost);
          return (
            <Discoverable key={t.id} id={t.id}>
              <button
                onClick={() => buy(t.id)}
                disabled={purchased || !affordable}
                title={t.description}
                className={`flex w-full items-center justify-between gap-4 border-b border-line py-2 text-left transition ${
                  purchased ? 'text-accent' : 'enabled:hover:text-accent disabled:text-muted'
                }`}
              >
                <span>{t.name}</span>
                <span className="font-num text-xs tabular-nums">
                  {purchased ? 'acquis' : `${formatFull(t.cost.knowledge)} savoir`}
                </span>
              </button>
            </Discoverable>
          );
        })}
      </div>
    </section>
  );
}

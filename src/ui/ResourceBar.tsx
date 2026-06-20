import { useStore } from '../state/store';
import { formatFull, formatInt, formatWatts } from '../format/notation';

// En-tête sobre (cf. 04_art_direction §4) : la Population, en chiffres pleins, domine seule.
// Énergie (W + type Kardashev) et Savoir en second rang, plus discrets. Pas de barre d'icônes,
// pas de cadres : la hiérarchie se fait par l'espace et la typo.
export function ResourceBar() {
  const population = useStore((s) => s.resources.population.amount);
  const resources = useStore((s) => s.resources.resources.amount);
  const energy = useStore((s) => s.resources.energy.amount);
  const knowledge = useStore((s) => s.resources.knowledge.amount);

  return (
    <header className="flex flex-col items-center gap-1 py-10 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-muted">Humains</div>
      <div className="font-num text-5xl font-semibold tabular-nums text-fg">
        {formatInt(population)}
      </div>

      {/* La capacité de charge n'est JAMAIS affichée : le plateau se ressent par le
          ralentissement de la croissance (logistique), pas par un chiffre nu. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm text-muted">
        <span className="font-num tabular-nums">{formatFull(resources)} ressources</span>
        <span className="font-num tabular-nums">{formatFull(knowledge)} savoir</span>
        <span className="font-num tabular-nums">{formatWatts(energy)}</span>
      </div>
    </header>
  );
}

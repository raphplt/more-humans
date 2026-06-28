import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { tierByLevel } from '../data/tiers.data';
import { ResourceBar } from './ResourceBar';
import { EndScreen } from './EndScreen';
import { OfflineRecapView } from './OfflineRecapView';
import { Toaster } from './Toaster';
import { JournalView } from './JournalView';
import { GeneratorList } from './GeneratorList';
import { UpgradeList } from './UpgradeList';
import { TechTree } from './TechTree';
import { ClickTarget } from './ClickTarget';
import { AllocationBar } from './AllocationBar';
import { PhaseView } from './PhaseView';
import { exportSave, importSave, saveGame, STORAGE_KEY } from '../state/save';

// Bannière éphémère au franchissement d'un tier — l'un des rares moments forts du jeu.
function TierBanner() {
  const tier = useStore((s) => s.tier);
  const [shown, setShown] = useState<number | null>(null);
  const prev = useRef(tier);

  useEffect(() => {
    if (tier > prev.current && tier > 0) {
      setShown(tier);
      const t = setTimeout(() => setShown(null), 3400);
      prev.current = tier;
      return () => clearTimeout(t);
    }
    prev.current = tier;
  }, [tier]);

  if (shown === null) return null;
  return (
    <div className="tier-flash pointer-events-none fixed left-1/2 top-20 z-30 flex flex-col items-center gap-1 text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-muted">Nouvelle ère</span>
      <span className="text-2xl font-semibold text-accent">{tierByLevel(shown)?.name}</span>
    </div>
  );
}

// Fil d'objectif : une seule ligne, qui dit quoi faire ensuite (onboarding + carotte court terme).
function ObjectiveLine() {
  const pop = useStore((s) => s.resources.population.amount);
  const owned = useStore((s) => s.owned);
  const tier = useStore((s) => s.tier);

  let text: string | null = null;
  if (pop.lt(25)) text = 'Clique sur « Peupler » pour faire naître les premiers Humains.';
  else if (!owned['hunting_band']) text = 'Bâtis une Bande de chasseurs pour automatiser la croissance.';
  else if (tier === 0) text = 'Accumule de la puissance jusqu’à franchir l’ère Planétaire.';

  if (!text) return null;
  return <p className="text-center text-xs text-muted">{text}</p>;
}

export function App() {
  const hydrate = useStore((s) => s.hydrate);
  const hardReset = useStore((s) => s.hardReset);
  const tier = useStore((s) => s.tier);
  const [endDismissed, setEndDismissed] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  const onExport = () => {
    const code = exportSave(useStore.getState());
    void navigator.clipboard?.writeText(code);
    window.prompt('Sauvegarde (copiée) :', code);
  };
  const onImport = () => {
    const code = window.prompt('Colle une sauvegarde :');
    if (!code) return;
    const state = importSave(code);
    if (state) hydrate(state);
    else window.alert('Sauvegarde invalide.');
  };
  const onReset = () => {
    if (!window.confirm('Effacer la partie et recommencer ?')) return;
    localStorage.removeItem(STORAGE_KEY);
    hardReset();
  };

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col px-6">
      <OfflineRecapView />
      <TierBanner />
      <Toaster />
      {journalOpen && <JournalView onClose={() => setJournalOpen(false)} />}
      {tier >= 3 && !endDismissed && <EndScreen onDismiss={() => setEndDismissed(true)} />}
      <div className="flex justify-end pt-3">
        <details className="relative text-sm text-muted">
          <summary className="cursor-pointer list-none hover:text-fg">≡</summary>
          <div className="absolute right-0 z-10 mt-2 flex w-44 flex-col gap-1 rounded-base border border-line bg-surface p-2">
            <button onClick={() => setJournalOpen(true)} className="rounded-base px-2 py-1 text-left hover:text-fg">
              Journal
            </button>
            <button onClick={() => saveGame(useStore.getState())} className="rounded-base px-2 py-1 text-left hover:text-fg">
              Sauver
            </button>
            <button onClick={onExport} className="rounded-base px-2 py-1 text-left hover:text-fg">
              Exporter
            </button>
            <button onClick={onImport} className="rounded-base px-2 py-1 text-left hover:text-fg">
              Importer
            </button>
            <button onClick={onReset} className="rounded-base px-2 py-1 text-left text-warn hover:opacity-80">
              Recommencer
            </button>
          </div>
        </details>
      </div>

      <ResourceBar />

      <main className="flex flex-col gap-10 pb-16">
        <div className="flex flex-col gap-3">
          <ClickTarget />
          <ObjectiveLine />
        </div>
        <AllocationBar />
        <PhaseView />
        <GeneratorList />
        <TechTree />
        <UpgradeList />
      </main>
    </div>
  );
}

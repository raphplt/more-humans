import { useStore } from '../state/store';
import { ResourceBar } from './ResourceBar';
import { GeneratorList } from './GeneratorList';
import { UpgradeList } from './UpgradeList';
import { TechTree } from './TechTree';
import { ClickTarget } from './ClickTarget';
import { PhaseView } from './PhaseView';
import { exportSave, importSave, saveGame, STORAGE_KEY } from '../state/save';
import type { ThemeName } from '../model/types';

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'instrument', label: 'Instrument' },
  { id: 'brutalist', label: 'Brutalisme' },
  { id: 'cosmic', label: 'Cosmique' },
];

// Layout : une colonne centrée, aérée (cf. 04_art_direction §4). Hiérarchie par l'espace, pas par
// des cadres. Réglages dans un menu discret, pas une rangée de boutons bordés.
export function App() {
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const hydrate = useStore((s) => s.hydrate);
  const hardReset = useStore((s) => s.hardReset);

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
      <div className="flex justify-end pt-3">
        <details className="relative text-sm text-muted">
          <summary className="cursor-pointer list-none hover:text-fg">≡</summary>
          <div className="absolute right-0 z-10 mt-2 flex w-44 flex-col gap-1 rounded-base border border-line bg-surface p-2">
            <div className="px-1 pb-1 text-xs uppercase tracking-wide text-muted">Charte</div>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`rounded-base px-2 py-1 text-left transition hover:text-fg ${
                  theme === t.id ? 'text-accent' : ''
                }`}
              >
                {t.label}
              </button>
            ))}
            <div className="my-1 border-t border-line" />
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
        <ClickTarget />
        <PhaseView />
        <GeneratorList />
        <TechTree />
        <UpgradeList />
      </main>
    </div>
  );
}

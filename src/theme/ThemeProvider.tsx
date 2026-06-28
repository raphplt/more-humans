import { useEffect, type ReactNode } from 'react';
import { useStore } from '../state/store';

// Pose `data-theme` sur <html> selon settings.theme. Changer de charte = changer un attribut,
// zéro modif de composant (cf. architecture §9). C'est une préoccupation UI, pas de game logic.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.settings.theme);
  const tier = useStore((s) => s.tier);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // L'accent évolue par ère (Aube → Planétaire → Stellaire → Galactique) : identité visuelle de
  // progression, sans quitter la couche tokens.
  useEffect(() => {
    document.documentElement.setAttribute('data-tier', String(tier));
  }, [tier]);

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { useStore } from '../state/store';

// Révélation progressive (cf. architecture §10, 04_art_direction §5).
// Un élément non découvert est ABSENT du DOM — jamais rendu grisé. Une fois découvert, il
// apparaît avec une micro-transition et reste (le moteur ne re-cache jamais un id).
export function Discoverable({ id, children }: { id: string; children: ReactNode }) {
  const discovered = useStore((s) => s.discovered[id] === true);
  if (!discovered) return null;
  return <div className="discoverable-enter">{children}</div>;
}

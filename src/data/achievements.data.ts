import type { AchievementDef, GameState } from '../model/types';

// Succès = objectifs gratifiants tout du long (carotte court terme + repères de progression).
// Prédicats purs sur l'état. Détectés dans le store (hors `step`, pour garder le moteur léger).
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_humans', name: 'Les premiers feux', description: 'Atteindre 25 Humains.', test: (s) => s.resources.population.amount.gte(25) },
  { id: 'automation', name: 'Première automatisation', description: 'Bâtir une Bande de chasseurs.', test: (s) => (s.owned['hunting_band'] ?? 0) >= 1 },
  { id: 'sedentary', name: 'Sédentaires', description: 'Cultiver des Champs.', test: (s) => (s.owned['farmland'] ?? 0) >= 1 },
  { id: 'tribe', name: 'Une vraie tribu', description: 'Atteindre 1 000 Humains.', test: (s) => s.resources.population.amount.gte(1000) },
  { id: 'scholar', name: 'Le goût du savoir', description: 'Monter une amélioration au niveau 5.', test: (s) => Object.values(s.upgradeLevels).some((l) => l >= 5) },
  { id: 'industry', name: 'Révolution industrielle', description: 'Allumer une Centrale à charbon.', test: (s) => (s.owned['coal_plant'] ?? 0) >= 1 },
  { id: 'planetary', name: 'Civilisation planétaire', description: 'Entrer dans le Tier I (Kardashev).', test: (s) => s.tier >= 1 },
  { id: 'fusion', name: 'Le feu des étoiles', description: 'Maîtriser la fusion.', test: (s) => s.purchased['fusion'] === true },
  { id: 'million', name: 'Un million d’âmes', description: 'Atteindre 1 000 000 d’Humains.', test: (s) => s.resources.population.amount.gte(1000000) },
  { id: 'stellar', name: 'Civilisation stellaire', description: 'Entrer dans le Tier II.', test: (s) => s.tier >= 2 },
  { id: 'dyson', name: 'Bâtisseur de sphères', description: 'Construire un Collecteur orbital.', test: (s) => (s.owned['orbital_collector'] ?? 0) >= 1 },
  { id: 'type_two', name: 'Type II', description: 'Atteindre Kardashev II — la fin de l’ascension.', test: (s) => s.tier >= 3 },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Ids de succès qui passent à débloqués dans cet état (non encore marqués). Pur. */
export function newlyUnlocked(state: GameState, current: Record<string, boolean>): string[] {
  return ACHIEVEMENTS.filter((a) => !current[a.id] && a.test(state)).map((a) => a.id);
}

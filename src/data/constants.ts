import Decimal from 'break_infinity.js';


export const POP_START = new Decimal(0);
export const POP_NEOLITHIC = new Decimal('5e6');
export const POP_TODAY = new Decimal('8e9');
export const POWER_TODAY = new Decimal('2e13');

// Portes de Kardashev
export const KARDASHEV_I = new Decimal('1e16'); // planétaire
export const EARTH_SOLAR_INFLUX = new Decimal('1.7e17'); // plafond planétaire
export const KARDASHEV_II = new Decimal('3.8e26'); // luminosité du Soleil
export const KARDASHEV_III = new Decimal('4e37'); // ~10¹¹ étoiles

export const STARS_IN_GALAXY = new Decimal('2e11');
export const SOLAR_MASS = new Decimal('2e30'); // kg
export const EARTH_MASS = new Decimal('6e24'); // kg

// Plafonds de calcul / d'information (endgame).
export const LANDAUER_LIMIT_300K = new Decimal('2.85e-21'); // J pour effacer 1 bit à 300 K
export const HEAT_DEATH_YEARS = new Decimal('1e100'); // horloge ultime

// Point de départ de la puissance (très faible, combustion du bois).
export const POWER_START = new Decimal('1e4');

/** Type de Kardashev fractionnaire (formule de Sagan) : K = (log₁₀ P − 6) / 10. */
export function kardashevType(power: Decimal): number {
  if (power.lte(0)) return 0;
  return (power.log10() - 6) / 10;
}

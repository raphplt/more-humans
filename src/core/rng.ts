// PRNG seedé (mulberry32) — déterministe, pour la couche roguelite future. Cf. 01_ARCHITECTURE §3.
// Présent dès le squelette pour que l'extension = ajout de modules, jamais une réécriture.

export interface Rng {
  next(): number; // [0, 1)
  int(maxExclusive: number): number;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (maxExclusive: number) => Math.floor(next() * maxExclusive),
  };
}

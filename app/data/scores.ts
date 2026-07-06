export interface ScoreEntry {
  rank: number;
  name: string; // nombre del jugador, e.g. "PX_KAI"
  score: number;
  date: string; // e.g. "2026-03-14"
}

const NAME_PREFIXES = [
  'PX',
  'NEO',
  'ZX',
  'VOID',
  'RGX',
  'KAI',
  'JYN',
  'MX',
  'CRT',
  'FX',
];

const NAME_SUFFIXES = [
  'KAI',
  'RYU',
  'NOVA',
  'ZERO',
  'VEX',
  'AXE',
  'FOX',
  'JET',
  'ION',
  'RAY',
];

// PRNG determinista (mulberry32): misma semilla → misma secuencia siempre.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Genera N scores ficticios reproducibles dado una semilla numérica.
// Sustituirá a una llamada a BD cuando exista el backend.
export function seededScores(seed: number, count: number): ScoreEntry[] {
  const rand = mulberry32(seed);
  const entries: ScoreEntry[] = [];

  let score = 100000 + Math.floor(rand() * 50000);

  for (let i = 0; i < count; i++) {
    const prefix = NAME_PREFIXES[Math.floor(rand() * NAME_PREFIXES.length)];
    const suffix = NAME_SUFFIXES[Math.floor(rand() * NAME_SUFFIXES.length)];
    const name = `${prefix}_${suffix}`;

    score = Math.max(100, score - Math.floor(rand() * 8000 + 500));

    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);

    entries.push({
      rank: i + 1,
      name,
      score,
      date: `2026-${pad(month)}-${pad(day)}`,
    });
  }

  return entries;
}

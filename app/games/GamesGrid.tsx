'use client';

import { useMemo, useState } from 'react';
import GameCard from '@/components/GameCard';
import type { GameRow } from '@/lib/supabase/types';

const CATEGORIES: Array<GameRow['cat'] | 'TODOS'> = [
  'TODOS',
  'ARCADE',
  'PUZZLE',
  'SHOOTER',
];

export default function GamesGrid({
  games,
}: {
  games: Array<GameRow & { best: number }>;
}) {
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>('TODOS');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory = category === 'TODOS' || game.cat === category;
      const matchesQuery = game.title
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [games, category, query]);

  return (
    <>
      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="Buscar un juego por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="av-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: 80,
              color: 'var(--ink-faint)',
            }}
          >
            <div
              className="pixel"
              style={{
                fontSize: 14,
                color: 'var(--magenta)',
                marginBottom: 12,
              }}
            >
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </>
  );
}

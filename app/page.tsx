'use client';

import { useMemo, useState } from 'react';
import GameCard from '@/components/GameCard';
import { GAMES, type Game } from '@/app/data';

const CATEGORIES: Array<Game['cat'] | 'TODOS'> = [
  'TODOS',
  'ARCADE',
  'PUZZLE',
  'SHOOTER',
];

export default function Home() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('TODOS');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return GAMES.filter((game) => {
      const matchesCategory = category === 'TODOS' || game.cat === category;
      const matchesQuery = game.title
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </p>
      </section>

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
              style={{ fontSize: 14, color: 'var(--magenta)', marginBottom: 12 }}
            >
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}

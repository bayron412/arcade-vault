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
    <>
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERTA CRÉDITOS PARA CONTINUAR<span className="blink">_</span>
        </p>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
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
      </div>
    </>
  );
}

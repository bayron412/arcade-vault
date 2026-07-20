'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';

const MAX_POKEMON = 1010;

function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
  padding: '64px 24px',
  textAlign: 'center',
};

const spriteBoxStyle: CSSProperties = {
  width: 220,
  height: 220,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-2)',
  border: '1px solid var(--ink-faint)',
  borderRadius: 12,
};

export default function PokemonCounter() {
  const [count, setCount] = useState(1);

  const increment = () => setCount((c) => (c % MAX_POKEMON) + 1);

  return (
    <div className="fade-in" style={containerStyle}>
      <div className="kicker pixel neon-cyan">▸ CONTADOR POKÉMON</div>
      <h1 className="pixel" style={{ fontSize: 20 }}>
        #{String(count).padStart(3, '0')}
      </h1>

      <div style={spriteBoxStyle}>
        <img
          src={spriteUrl(count)}
          alt={`Pokémon #${count}`}
          width={180}
          height={180}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <button type="button" className="btn xl press" onClick={increment}>
        ▶ SIGUIENTE POKÉMON ({count})
      </button>
    </div>
  );
}

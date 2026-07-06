'use client';

import { useMemo, useState } from 'react';
import { GAMES, seededScores, type ScoreEntry } from '@/app/data';
import { useUser } from '@/app/context/UserContext';

export default function HallOfFamePage() {
  const { user } = useUser();
  const [activeId, setActiveId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === activeId) ?? GAMES[0];

  const entries = useMemo<ScoreEntry[]>(() => {
    const base = seededScores(game.id.length + game.best, 15);
    if (!user) return base;

    const youRank = Math.min(7, base.length);
    return base.map((entry) =>
      entry.rank === youRank ? { ...entry, name: user } : entry,
    );
  }, [game, user]);

  const [first, second, third] = entries;

  return (
    <div className="av-hall">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>Las leyendas del Arcade Vault, juego por juego.</p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip ${g.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot rank="silver" entry={second} />
        <PodiumSlot rank="gold" entry={first} />
        <PodiumSlot rank="bronze" entry={third} />
      </div>

      <div className="hall-table">
        <div className="th">
          <span>RANK</span>
          <span>JUGADOR</span>
          <span>PUNTUACIÓN</span>
          <span>FECHA</span>
        </div>
        {entries.map((entry, i) => (
          <div
            key={entry.rank}
            className={`tr ${entry.rank <= 3 ? `top${entry.rank}` : ''} ${
              entry.name === user ? 'you' : ''
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="rk">#{entry.rank}</span>
            <span className="pl">{entry.name}</span>
            <span className="sc">{entry.score.toLocaleString('en-US')}</span>
            <span className="dt">{entry.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumSlot({
  rank,
  entry,
}: {
  rank: 'gold' | 'silver' | 'bronze';
  entry: ScoreEntry;
}) {
  const rankNum = rank === 'gold' ? 1 : rank === 'silver' ? 2 : 3;
  return (
    <div className={`podium-slot ${rank}`}>
      <div className="rank-num">{rankNum}</div>
      <div className="name">{entry.name}</div>
      <div className="score">{entry.score.toLocaleString('en-US')}</div>
      <div className="date">{entry.date}</div>
    </div>
  );
}

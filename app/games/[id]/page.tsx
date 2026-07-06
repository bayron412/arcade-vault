'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { GAMES, seededScores } from '@/app/data';

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === params.id);

  if (!game) notFound();

  const scores = seededScores(game.id.length + game.best, 10);

  return (
    <div className="av-detail">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} />
        </div>
        <div className="detail-actions">
          <Link href={`/games/${game.id}/play`} className="btn xl pulse">
            JUGAR AHORA
          </Link>
          <Link href="/" className="btn ghost">
            VOLVER AL VAULT
          </Link>
        </div>
      </div>

      <div className="detail-info">
        <div className="detail-tags">
          <span>{game.cat}</span>
          <span>{game.plays} PARTIDAS</span>
        </div>
        <h2 className={`neon-${game.color}`}>{game.title}</h2>
        <p>{game.long}</p>

        <div className="stat-strip">
          <div>
            <div className="l">Mejor puntuación</div>
            <div className="v">{game.best.toLocaleString('en-US')}</div>
          </div>
          <div>
            <div className="l">Partidas jugadas</div>
            <div className="v">{game.plays}</div>
          </div>
          <div>
            <div className="l">Categoría</div>
            <div className="v">{game.cat}</div>
          </div>
        </div>

        <div className="leaderboard">
          <h3>LEADERBOARD</h3>
          {scores.map((entry) => (
            <div
              key={entry.rank}
              className={`lb-row ${entry.rank <= 3 ? `top${entry.rank}` : ''}`}
            >
              <span className="rk">#{entry.rank}</span>
              <span className="pl">{entry.name}</span>
              <span className="sc">{entry.score.toLocaleString('en-US')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

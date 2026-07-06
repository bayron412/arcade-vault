'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { GAMES, seededScores } from '@/app/data';

export default function GameDetailPage() {
  const params = useParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === params.id);

  if (!game) notFound();

  const scores = seededScores(game.id.length * 17 + 3, 10);

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>

          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{ color: 'var(--magenta)', textShadow: '0 0 6px rgba(255,0,110,0.5)' }}
              >
                {game.best.toLocaleString('es-ES')}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{ color: 'var(--yellow)', textShadow: '0 0 6px rgba(245,255,0,0.5)' }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link href={`/games/${game.id}/play`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.map((entry) => (
            <div
              key={entry.rank}
              className={`lb-row ${entry.rank <= 3 ? `top${entry.rank}` : ''}`}
            >
              <div className="rk">#{String(entry.rank).padStart(2, '0')}</div>
              <div className="pl">
                {entry.name}
                <div style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
                  {entry.date}
                </div>
              </div>
              <div className="sc">{entry.score.toLocaleString('es-ES')}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

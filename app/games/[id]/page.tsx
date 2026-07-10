import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { GameRow, ScoreRow } from '@/lib/supabase/types';

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: game }, { data: scores }, { count: plays }] =
    await Promise.all([
      supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .returns<GameRow[]>()
        .maybeSingle(),
      supabase
        .from('scores')
        .select('*')
        .eq('game_id', id)
        .order('score', { ascending: false })
        .limit(10)
        .returns<ScoreRow[]>(),
      supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', id),
    ]);

  if (!game) notFound();

  const best = scores?.[0]?.score ?? 0;

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
              <div className="v">{(plays ?? 0).toLocaleString('es-ES')}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: 'var(--magenta)',
                  textShadow: '0 0 6px rgba(255,0,110,0.5)',
                }}
              >
                {best.toLocaleString('es-ES')}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: 'var(--yellow)',
                  textShadow: '0 0 6px rgba(245,255,0,0.5)',
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link href={`/games/${game.id}/play`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores && scores.length > 0 ? (
            scores.map((entry, i) => (
              <div
                key={entry.id}
                className={`lb-row ${i < 3 ? `top${i + 1}` : ''}`}
              >
                <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
                <div className="pl">
                  {entry.player_name}
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-faint)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {new Date(entry.created_at).toISOString().slice(0, 10)}
                  </div>
                </div>
                <div className="sc">{entry.score.toLocaleString('es-ES')}</div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '24px 0',
                color: 'var(--ink-faint)',
                textAlign: 'center',
              }}
            >
              Sé el primero en entrar al salón de la fama
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

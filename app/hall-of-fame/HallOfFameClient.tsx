'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GameRow, ScoreRow } from '@/lib/supabase/types';
import { useUser } from '@/app/context/UserContext';

function formatDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function HallOfFameClient({ games }: { games: GameRow[] }) {
  const { username } = useUser();
  const [tab, setTab] = useState(games[0]?.id ?? '');
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const game = games.find((g) => g.id === tab);

  useEffect(() => {
    if (!tab) return;
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from('scores')
      .select('*')
      .eq('game_id', tab)
      .order('score', { ascending: false })
      .limit(12)
      .returns<ScoreRow[]>()
      .then(({ data }) => {
        if (!cancelled) setScores(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const youIndex = username
    ? scores.findIndex(
        (s) => s.player_name.toLowerCase() === username.toLowerCase(),
      )
    : -1;
  const youEntry = youIndex >= 0 ? scores[youIndex] : null;

  if (games.length === 0) {
    return (
      <div className="av-hall fade-in">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
        </div>
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--ink-faint)',
          }}
        >
          Sé el primero en entrar al salón de la fama
        </div>
      </div>
    );
  }

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip ${tab === g.id ? 'active' : ''}`}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {scores.length > 0 && (
        <div className="podium">
          {scores[1] && (
            <div className="podium-slot silver">
              <div className="rank-num">02</div>
              <div className="name">{scores[1].player_name}</div>
              <div className="score">
                {scores[1].score.toLocaleString('es-ES')}
              </div>
              <div className="date">{formatDate(scores[1].created_at)}</div>
            </div>
          )}
          {scores[0] && (
            <div className="podium-slot gold">
              <div
                className="pixel"
                style={{
                  fontSize: 9,
                  color: 'var(--gold)',
                  letterSpacing: '0.18em',
                }}
              >
                CAMPEÓN
              </div>
              <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                01
              </div>
              <div className="name">{scores[0].player_name}</div>
              <div className="score" style={{ fontSize: 20 }}>
                {scores[0].score.toLocaleString('es-ES')}
              </div>
              <div className="date">{formatDate(scores[0].created_at)}</div>
            </div>
          )}
          {scores[2] && (
            <div className="podium-slot bronze">
              <div className="rank-num">03</div>
              <div className="name">{scores[2].player_name}</div>
              <div className="score">
                {scores[2].score.toLocaleString('es-ES')}
              </div>
              <div className="date">{formatDate(scores[2].created_at)}</div>
            </div>
          )}
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {scores.length === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--ink-faint)',
            }}
          >
            Sé el primero en entrar al salón de la fama
          </div>
        ) : (
          scores.map((r, i) => (
            <div
              key={r.id}
              className={`tr ${i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="rk">#{String(i + 1).padStart(2, '0')}</div>
              <div className="pl">{r.player_name}</div>
              <div className="sc">{r.score.toLocaleString('es-ES')}</div>
              <div className="dt">{formatDate(r.created_at)}</div>
            </div>
          ))
        )}
        {youEntry && (
          <>
            <div className="tr you-label">
              ▸ TU MEJOR MARCA EN {game?.title}
            </div>
            <div
              className="tr you"
              style={{ animationDelay: `${scores.length * 50 + 50}ms` }}
            >
              <div className="rk" style={{ color: 'var(--yellow)' }}>
                #{String(youIndex + 1).padStart(2, '0')}
              </div>
              <div className="pl" style={{ color: 'var(--yellow)' }}>
                {youEntry.player_name}
              </div>
              <div
                className="sc"
                style={{
                  color: 'var(--yellow)',
                  textShadow: '0 0 6px rgba(245,255,0,0.5)',
                }}
              >
                {youEntry.score.toLocaleString('es-ES')}
              </div>
              <div className="dt">{formatDate(youEntry.created_at)}</div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}

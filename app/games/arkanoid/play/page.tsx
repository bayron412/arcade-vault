'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/app/context/UserContext';

const ArkanoidGame = dynamic(() => import('@/components/games/ArkanoidGame'), {
  ssr: false,
});

const game = { id: 'arkanoid', title: 'ARKANOID' };

export default function ArkanoidPlayPage() {
  const router = useRouter();
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ?? 'INVITADO');
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const crtScreenRef = useRef<HTMLDivElement>(null);
  const crtBottomRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const screenEl = crtScreenRef.current;
    if (!screenEl) return;

    const recompute = () => {
      const container = screenEl.parentElement;
      if (!container) return;

      const containerStyle = window.getComputedStyle(container);
      const paddingX =
        parseFloat(containerStyle.paddingLeft) +
        parseFloat(containerStyle.paddingRight);
      const availableWidth = container.clientWidth - paddingX;
      const top = screenEl.getBoundingClientRect().top;
      const bottomReserved =
        (crtBottomRef.current?.offsetHeight ?? 24) + 14 + 24 + 24;
      const availableHeight = window.innerHeight - top - bottomReserved;

      const widthFromHeight = Math.max(200, availableHeight * (4 / 3));
      setScreenWidth(Math.max(200, Math.min(availableWidth, widthFromHeight)));
    };

    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    const ro = new ResizeObserver(recompute);
    ro.observe(screenEl.parentElement as Element);

    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!over) return;
    const stored = localStorage.getItem('av_player_name');
    if (stored) setName(stored);
  }, [over]);

  const saveScore = async () => {
    localStorage.setItem('av_player_name', name);
    setSaved(true);

    const supabase = createClient();
    await supabase.from('scores').insert({
      game_id: game.id,
      player_name: name,
      score,
      user_id: null,
    });
  };

  const restart = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setGameKey((k) => k + 1);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: 'var(--ink)' }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString('es-ES')}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{'♥ '.repeat(lives).trim() || '—'}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, '0')}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button
            type="button"
            className="btn yellow"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'REANUDAR' : 'PAUSA'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => router.push(`/games/${game.id}`)}
          >
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div
          ref={crtScreenRef}
          className="crt-screen"
          style={
            screenWidth ? { width: screenWidth, margin: '0 auto' } : undefined
          }
        >
          <ArkanoidGame
            key={gameKey}
            paused={paused}
            onScoreChange={setScore}
            onLivesChange={setLives}
            onLevelChange={setLevel}
            onGameOver={() => setOver(true)}
          />
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={crtBottomRef} className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">Puntuación final</div>
            <div className="final">{score.toLocaleString('es-ES')}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  type="button"
                  className="btn yellow"
                  onClick={saveScore}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

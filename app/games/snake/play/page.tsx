'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/app/context/UserContext';
import {
  SKINS,
  SKIN_ORDER,
  SKIN_STORAGE_KEY,
  type SkinId,
} from '@/components/games/SnakeGame';

const SnakeGame = dynamic(() => import('@/components/games/SnakeGame'), {
  ssr: false,
});

const game = { id: 'snake', title: 'SNAKE' };

// SnakeGame renders a square 600x600 canvas, not the 4:3 ratio the shared
// `.crt-screen` box assumes for other games.
const SNAKE_ASPECT = 1;

export default function SnakePlayPage() {
  const router = useRouter();
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ?? 'INVITADO');
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [skin, setSkin] = useState<SkinId>('classic');

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

      const widthFromHeight = Math.max(200, availableHeight * SNAKE_ASPECT);
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

  useEffect(() => {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY) as SkinId | null;
    if (stored && SKINS[stored]) setSkin(stored);
  }, []);

  const changeSkin = (id: SkinId) => {
    setSkin(id);
    localStorage.setItem(SKIN_STORAGE_KEY, id);
  };

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
    setLength(3);
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
          <div className="hud-stat">
            <div className="l">Longitud</div>
            <div className="v">{length}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Skin</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {SKIN_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeSkin(id)}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    padding: '4px 7px',
                    borderRadius: 3,
                    cursor: 'pointer',
                    color: skin === id ? SKINS[id].boardBg : SKINS[id].accent,
                    background: skin === id ? SKINS[id].accent : 'transparent',
                    border: `1px solid ${SKINS[id].accent}`,
                  }}
                >
                  {SKINS[id].label}
                </button>
              ))}
            </div>
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
          style={{
            aspectRatio: SNAKE_ASPECT,
            ...(screenWidth
              ? { width: screenWidth, margin: '0 auto' }
              : undefined),
          }}
        >
          <SnakeGame
            key={gameKey}
            paused={paused}
            skin={skin}
            onScoreChange={setScore}
            onLengthChange={setLength}
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
              <Link href={`/games/${game.id}`} className="btn ghost">
                VER PUNTUACIONES
              </Link>
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

'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GAMES } from '@/app/data';
import { useUser } from '@/app/context/UserContext';

export default function PlayPage() {
  const params = useParams<{ id: string }>();
  const game = GAMES.find((g) => g.id === params.id);
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nameInput, setNameInput] = useState(user ?? 'INVITADO');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (paused || gameOver) return;
    const id = setInterval(() => {
      setScore((s) => s + Math.floor(Math.random() * 40 + 10));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, gameOver]);

  useEffect(() => {
    setLevel(1 + Math.floor(score / 2000));
  }, [score]);

  if (!game) notFound();

  const handleFin = () => {
    setGameOver(true);
    setPaused(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="av-player">
      <div className="player-hud">
        <div className="hud-stat">
          <span className="l">Jugador</span>
          <span className="v">{user ?? 'INVITADO'}</span>
        </div>
        <div className="hud-stat">
          <span className="l">Puntuación</span>
          <span className="v">{score.toLocaleString('en-US')}</span>
        </div>
        <div className="hud-stat lives">
          <span className="l">Vidas</span>
          <span className="v">{'♥'.repeat(lives)}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">Nivel</span>
          <span className="v">{level}</span>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn ghost" onClick={() => setPaused((p) => !p)}>
            {paused ? 'REANUDAR' : 'PAUSA'}
          </button>
          <button type="button" className="btn magenta" onClick={handleFin}>
            FIN
          </button>
          <Link href={`/games/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="player-ship" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
          </div>
        </div>
        <div className="crt-bottom">
          <span className={`neon-${game.color}`}>{game.title}</span>
          <span className="led">EN LÍNEA</span>
        </div>
      </div>

      {paused && !gameOver && (
        <div className="modal-bd">
          <div className="modal">
            <h2>PAUSA</h2>
            <p>El juego está en pausa.</p>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setPaused(false)}>
                REANUDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="modal-bd">
          <div className="modal">
            <h2>GAME OVER</h2>
            <div className="final-label">Puntuación final</div>
            <div className="final">{score.toLocaleString('en-US')}</div>
            <div className="input-row">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <button type="button" className="btn" onClick={handleSave}>
                GUARDAR
              </button>
            </div>
            {saved && <div className="toast-saved">PUNTUACIÓN GUARDADA</div>}
            <div className="actions">
              <Link href={`/games/${game.id}`} className="btn ghost">
                SALIR
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

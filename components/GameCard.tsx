'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import type { GameRow } from '@/lib/supabase/types';

const MAX_TILT = 10;

const BUTTON_COLOR_CLASS: Partial<Record<GameRow['color'], string>> = {
  magenta: 'magenta',
  yellow: 'yellow',
};

export default function GameCard({
  game,
}: {
  game: GameRow & { best: number };
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const goToGame = () => router.push(`/games/${game.id}`);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) * 2 - 1) * -MAX_TILT;
    const rotateY = ((x / rect.width) * 2 - 1) * MAX_TILT;

    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    card.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      className="card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={goToGame}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <span className="label">{game.cat}</span>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
      </div>
      <div className="row">
        <div className="score-badge">
          <span>MEJOR PUNTUACIÓN</span>
          <b>{game.best.toLocaleString('es-ES')}</b>
        </div>
        <button
          type="button"
          className={`btn ${BUTTON_COLOR_CLASS[game.color] ?? ''}`}
          onClick={(e) => {
            e.stopPropagation();
            goToGame();
          }}
        >
          JUGAR
        </button>
      </div>
    </div>
  );
}

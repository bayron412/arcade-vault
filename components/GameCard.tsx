'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { Game } from '@/app/data';

const MAX_TILT = 10;

export default function GameCard({ game }: { game: Game }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

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
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <span className="label">{game.cat}</span>
      </div>
      <div className="meta">
        <div className={`title neon-${game.color}`}>{game.title}</div>
        <div className="desc">{game.short}</div>
      </div>
      <div className="row">
        <div className="score-badge">
          MEJOR PUNTUACIÓN
          <b>{game.best.toLocaleString('en-US')}</b>
        </div>
        <Link href={`/games/${game.id}`} className="btn">
          JUGAR
        </Link>
      </div>
    </div>
  );
}

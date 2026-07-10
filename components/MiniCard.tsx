'use client';

import { useRouter } from 'next/navigation';
import type { GameRow } from '@/lib/supabase/types';

export default function MiniCard({ game }: { game: GameRow }) {
  const router = useRouter();

  return (
    <div className="mini-card" onClick={() => router.push(`/games/${game.id}`)}>
      <div className="mini-cover">
        <div className={`cover-bg ${game.cover}`} />
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </div>
  );
}

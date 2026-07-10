import { createClient } from '@/lib/supabase/server';
import type { GameRow } from '@/lib/supabase/types';
import GamesGrid from './GamesGrid';

export default async function GamesPage() {
  const supabase = await createClient();

  const [{ data: games }, { data: scores }] = await Promise.all([
    supabase.from('games').select('*').returns<GameRow[]>(),
    supabase.from('scores').select('game_id, score'),
  ]);

  const bestByGame = new Map<string, number>();
  for (const { game_id, score } of scores ?? []) {
    const current = bestByGame.get(game_id) ?? 0;
    if (score > current) bestByGame.set(game_id, score);
  }

  const gamesWithBest = (games ?? []).map((game) => ({
    ...game,
    best: bestByGame.get(game.id) ?? 0,
  }));

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </p>
      </section>

      <GamesGrid games={gamesWithBest} />
    </div>
  );
}

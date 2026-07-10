import { createClient } from '@/lib/supabase/server';
import type { GameRow } from '@/lib/supabase/types';
import HomeClient from './HomeClient';

export default async function Home() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .returns<GameRow[]>();

  return <HomeClient games={games ?? []} />;
}

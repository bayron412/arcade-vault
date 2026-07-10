import { createClient } from '@/lib/supabase/server';
import type { GameRow } from '@/lib/supabase/types';
import HallOfFameClient from './HallOfFameClient';

export default async function HallOfFamePage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .returns<GameRow[]>();

  return <HallOfFameClient games={games ?? []} />;
}

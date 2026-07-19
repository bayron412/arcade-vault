'use client';

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  username: string | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

function deriveUsername(user: User | null): string | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  const raw =
    (metadata.username as string | undefined) ??
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    user.email?.split('@')[0] ??
    null;
  return raw ? raw.toUpperCase().slice(0, 10) : null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
  };

  const user = session?.user ?? null;
  const username = deriveUsername(user);

  return (
    <UserContext.Provider value={{ user, session, username, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}

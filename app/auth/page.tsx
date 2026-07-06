'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { login, signOut } = useUser();
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username.trim() || 'JUGADOR');
    router.push('/');
  };

  const handleGuest = () => {
    signOut();
    router.push('/');
  };

  return (
    <div className="av-auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2>ACCESO AL VAULT</h2>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={tab === 'login' ? 'on' : ''}
            onClick={() => setTab('login')}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'on' : ''}
            onClick={() => setTab('register')}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="PX_KAI"
            />
          </div>

          {tab === 'register' && (
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="jugador@vault.com" />
            </div>
          )}

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="••••••••" />
          </div>

          <button type="submit" className="btn xl" style={{ width: '100%' }}>
            {tab === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
          </button>
        </form>

        <div className="auth-divider">O CONTINÚA CON</div>

        <div className="social">
          <button type="button" className="btn ghost">
            GOOGLE
          </button>
          <button type="button" className="btn ghost">
            GITHUB
          </button>
        </div>

        <div className="auth-divider">O</div>

        <button type="button" className="btn yellow" style={{ width: '100%' }} onClick={handleGuest}>
          JUGAR COMO INVITADO
        </button>
      </div>
    </div>
  );
}

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login((username || 'PLAYER1').toUpperCase().slice(0, 10));
    router.push('/games');
  };

  const handleGuest = () => {
    signOut();
    router.push('/games');
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.16em', marginTop: 6 }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
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
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="px_kai"
            />
          </div>

          {tab === 'register' && (
            <div className="field slide-in">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn lg" style={{ width: '100%', marginTop: 8 }}>
            {tab === 'login' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
          </button>
        </form>

        <button
          type="button"
          className="btn ghost"
          style={{ width: '100%', marginTop: 10 }}
          onClick={handleGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>

        <div className="social">
          <button type="button" className="btn ghost">
            ◆ GOOGLE
          </button>
          <button type="button" className="btn ghost">
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

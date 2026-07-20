'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Tab = 'login' | 'register';
type View = 'form' | 'register-success' | 'forgot-password' | 'forgot-success';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [view, setView] = useState<View>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    if (tab === 'register' && !PASSWORD_REGEX.test(password)) {
      setPasswordError(
        'La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.',
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (tab === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push('/');
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: (username || 'PLAYER1').toUpperCase().slice(0, 10),
        },
      },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setView('register-success');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail,
      { redirectTo: `${window.location.origin}/auth/reset-password` },
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setView('forgot-success');
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {view === 'register-success' && (
          <div
            className="field slide-in"
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <p>Revisa tu correo para confirmar tu cuenta.</p>
          </div>
        )}

        {view === 'forgot-success' && (
          <div
            className="field slide-in"
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <p>Te hemos enviado un enlace de recuperación.</p>
          </div>
        )}

        {view === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="slide-in">
            <div className="field">
              <label htmlFor="forgot-email">Correo electrónico</label>
              <input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                required
              />
            </div>

            {error && (
              <div
                className="mono"
                style={{
                  color: 'var(--danger, #ff4d6d)',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              ENVIAR ENLACE
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                setView('form');
                setError(null);
              }}
            >
              VOLVER
            </button>
          </form>
        )}

        {view === 'form' && (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={tab === 'login' ? 'on' : ''}
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setPasswordError(null);
                }}
              >
                INICIAR SESIÓN
              </button>
              <button
                type="button"
                className={tab === 'register' ? 'on' : ''}
                onClick={() => {
                  setTab('register');
                  setError(null);
                  setPasswordError(null);
                }}
              >
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'register' && (
                <div className="field slide-in">
                  <label htmlFor="username">Usuario</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="px_kai"
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  required
                />
                {tab === 'register' && passwordError && (
                  <div
                    className="mono"
                    style={{
                      color: 'var(--danger, #ff4d6d)',
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    {passwordError}
                  </div>
                )}
              </div>

              {tab === 'login' && (
                <button
                  type="button"
                  className="mono"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    marginTop: 6,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onClick={() => {
                    setForgotEmail(email);
                    setError(null);
                    setView('forgot-password');
                  }}
                >
                  ¿OLVIDASTE TU CONTRASEÑA?
                </button>
              )}

              {error && (
                <div
                  className="mono"
                  style={{
                    color: 'var(--danger, #ff4d6d)',
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn lg"
                style={{ width: '100%', marginTop: 8 }}
                disabled={loading}
              >
                {tab === 'login' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
              </button>
            </form>

            <div className="auth-divider">O CONTINÚA CON</div>

            <div className="social">
              <button
                type="button"
                className="btn ghost"
                onClick={() => handleOAuth('google')}
              >
                ◆ GOOGLE
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => handleOAuth('github')}
              >
                ▣ GITHUB
              </button>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

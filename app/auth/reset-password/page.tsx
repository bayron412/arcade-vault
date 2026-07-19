'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'checking' | 'ready' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'ready' : 'invalid');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus('success');
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
            NUEVA CONTRASEÑA
          </div>
        </div>

        {status === 'checking' && (
          <div
            className="field"
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <p>Verificando enlace…</p>
          </div>
        )}

        {status === 'invalid' && (
          <div
            className="field"
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <p>El enlace de recuperación no es válido o ha expirado.</p>
            <a
              href="/auth"
              className="btn ghost"
              style={{ display: 'inline-block', marginTop: 12 }}
            >
              VOLVER A INICIAR SESIÓN
            </a>
          </div>
        )}

        {status === 'success' && (
          <div
            className="field slide-in"
            style={{ textAlign: 'center', padding: '12px 0' }}
          >
            <p>Contraseña actualizada.</p>
            <a
              href="/auth"
              className="btn ghost"
              style={{ display: 'inline-block', marginTop: 12 }}
            >
              IR A INICIAR SESIÓN
            </a>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

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
              ACTUALIZAR CONTRASEÑA
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

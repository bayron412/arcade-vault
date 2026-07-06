'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/app/context/UserContext';

const LINKS = [
  { href: '/', label: 'Biblioteca' },
  { href: '/hall-of-fame', label: 'Salón de la Fama' },
];

const CREDITS = '03';

export default function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [open, setOpen] = useState(false);

  const closeDrawer = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={closeDrawer}>
          <span className="logo-mark" />
          <span className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </span>
        </Link>

        <div className="links">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · {CREDITS}</span>
        </div>

        <div className="auth-btn">
          {user ? (
            <button type="button" className="btn ghost" onClick={signOut}>
              {user} ▾
            </button>
          ) : (
            <Link href="/auth" className="btn">
              Iniciar Sesión
            </Link>
          )}
        </div>

        <button
          type="button"
          className="hamburger btn ghost"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop ${open ? 'open' : ''}`}
        onClick={closeDrawer}
      />
      <div className={`av-mobile-panel ${open ? 'open' : ''}`}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
            onClick={closeDrawer}
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <Link href="/" className="" onClick={() => { signOut(); closeDrawer(); }}>
            Cerrar sesión ({user})
          </Link>
        ) : (
          <Link
            href="/auth"
            className={pathname === '/auth' ? 'active' : ''}
            onClick={closeDrawer}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}
        >
          CRÉDITOS · {CREDITS}
        </div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/app/context/UserContext';

const LINKS = [
  { href: '/', label: 'BIBLIOTECA' },
  { href: '/hall-of-fame', label: 'SALÓN DE LA FAMA' },
];

const CREDITS = 999;

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
          <span className="logo-text">ARCADE VAULT</span>
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
          {CREDITS}
        </div>

        <div className="auth-btn">
          {user ? (
            <button type="button" className="btn ghost" onClick={signOut}>
              {user}
            </button>
          ) : (
            <Link href="/auth" className="btn">
              INICIAR SESIÓN
            </Link>
          )}
        </div>

        <button
          type="button"
          className="hamburger btn ghost"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop ${open ? 'open' : ''}`}
        onClick={closeDrawer}
      />
      <div className={`av-mobile-panel ${open ? 'open' : ''}`}>
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
        <div className="coin-counter">
          <span className="coin" />
          {CREDITS}
        </div>
        {user ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              signOut();
              closeDrawer();
            }}
          >
            {user} — SALIR
          </button>
        ) : (
          <Link href="/auth" className="btn" onClick={closeDrawer}>
            INICIAR SESIÓN
          </Link>
        )}
      </div>
    </>
  );
}

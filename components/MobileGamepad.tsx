'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

export interface KeyMap {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  a?: string;
  b?: string;
}

export interface SkinOption {
  id: string;
  label: string;
}

export interface MobileGamepadProps {
  keyMap: KeyMap;
  paused: boolean;
  onPauseToggle: () => void;
  onExit: () => void;
  skin: string;
  skinOptions: SkinOption[];
  onSkinChange: (skin: string) => void;
}

const dispatchKey = (type: 'keydown' | 'keyup', code: string) => {
  document.dispatchEvent(
    new KeyboardEvent(type, { code, key: code, bubbles: true }),
  );
};

function GamepadButton({
  code,
  label,
  style,
}: {
  code?: string;
  label: string;
  style?: CSSProperties;
}) {
  // Pointer Events + pointer capture: locks the whole press/release gesture to
  // this button regardless of finger drift or React's passive touch listeners
  // (which silently ignore `preventDefault()` on onTouchStart in some browsers
  // and let the browser fire a delayed "compatibility click" on whatever
  // element ends up under the finger — that's what was stealing focus onto
  // PAUSA and dropping D-pad keyup events).
  const disabled = !code;

  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!code) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dispatchKey('keydown', code);
  };
  const release = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!code) return;
    e.preventDefault();
    dispatchKey('keyup', code);
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--ink)',
        background: 'var(--bg-3)',
        border: '1px solid var(--ink-faint)',
        borderRadius: 8,
        touchAction: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

export default function MobileGamepad({
  keyMap,
  paused,
  onPauseToggle,
  onExit,
  skin,
  skinOptions,
  onSkinChange,
}: MobileGamepadProps) {
  return (
    <div
      className="flex md:hidden"
      style={{
        flexDirection: 'column',
        gap: 12,
        marginTop: 16,
        padding: '12px 8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 48px)',
            gridTemplateRows: 'repeat(3, 48px)',
            gap: 4,
          }}
        >
          <GamepadButton
            code={keyMap.up}
            label="▲"
            style={{ gridColumn: 2, gridRow: 1 }}
          />
          <GamepadButton
            code={keyMap.left}
            label="◀"
            style={{ gridColumn: 1, gridRow: 2 }}
          />
          <GamepadButton
            code={keyMap.right}
            label="▶"
            style={{ gridColumn: 3, gridRow: 2 }}
          />
          <GamepadButton
            code={keyMap.down}
            label="▼"
            style={{ gridColumn: 2, gridRow: 3 }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            alignSelf: 'center',
          }}
        >
          <GamepadButton
            code={keyMap.b}
            label="B"
            style={{
              width: 48,
              height: 48,
              color: 'var(--magenta)',
              borderColor: 'var(--magenta)',
            }}
          />
          <GamepadButton
            code={keyMap.a}
            label="A"
            style={{
              width: 48,
              height: 48,
              color: 'var(--cyan)',
              borderColor: 'var(--cyan)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 8,
          width: '100%',
        }}
      >
        <select
          value={skin}
          onChange={(e) => onSkinChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink)',
            background: 'var(--bg-3)',
            border: '1px solid var(--ink-faint)',
            borderRadius: 6,
            padding: '8px 4px',
          }}
        >
          {skinOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn yellow"
          onClick={onPauseToggle}
          style={{ flex: 1, minWidth: 0, fontSize: 11, padding: '8px 4px' }}
        >
          {paused ? 'REANUDAR' : 'PAUSA'}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={onExit}
          style={{ flex: 1, minWidth: 0, fontSize: 11, padding: '8px 4px' }}
        >
          SALIR
        </button>
      </div>
    </div>
  );
}

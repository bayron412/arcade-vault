'use client';

import { useState } from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';

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

type DpadDirection = 'up' | 'down' | 'left' | 'right';

const DPAD_ARROW_PATHS: Record<DpadDirection, string> = {
  up: 'M12 4 L20 16 L4 16 Z',
  right: 'M8 4 L20 12 L8 20 Z',
  down: 'M4 8 L20 8 L12 20 Z',
  left: 'M16 4 L16 20 L4 12 Z',
};

function DpadArrowIcon({ direction }: { direction: DpadDirection }) {
  return (
    <svg
      className="mgp-dp-arrow"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d={DPAD_ARROW_PATHS[direction]} fill="currentColor" />
    </svg>
  );
}

function GamepadButton({
  code,
  label,
  icon,
  className,
  style,
}: {
  code?: string;
  label: string;
  icon?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  // Pointer Events + pointer capture: locks the whole press/release gesture to
  // this button regardless of finger drift or React's passive touch listeners
  // (which silently ignore `preventDefault()` on onTouchStart in some browsers
  // and let the browser fire a delayed "compatibility click" on whatever
  // element ends up under the finger — that's what was stealing focus onto
  // PAUSA and dropping D-pad keyup events).
  const disabled = !code;
  const [pressed, setPressed] = useState(false);

  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!code) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressed(true);
    dispatchKey('keydown', code);
  };
  const release = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!code) return;
    e.preventDefault();
    setPressed(false);
    dispatchKey('keyup', code);
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      data-pressed={pressed ? 'true' : undefined}
      className={className}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--ink)',
        background: className ? undefined : 'var(--bg-3)',
        border: className ? undefined : '1px solid var(--ink-faint)',
        borderRadius: className ? undefined : 8,
        touchAction: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {icon ?? label}
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
        marginTop: 16,
      }}
    >
      <div className="mgp">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="mgp-dpad">
            <GamepadButton
              code={keyMap.up}
              label="up"
              icon={<DpadArrowIcon direction="up" />}
              className="mgp-dp mgp-dp-up"
            />
            <GamepadButton
              code={keyMap.left}
              label="left"
              icon={<DpadArrowIcon direction="left" />}
              className="mgp-dp mgp-dp-left"
            />
            <GamepadButton
              code={keyMap.right}
              label="right"
              icon={<DpadArrowIcon direction="right" />}
              className="mgp-dp mgp-dp-right"
            />
            <GamepadButton
              code={keyMap.down}
              label="down"
              icon={<DpadArrowIcon direction="down" />}
              className="mgp-dp mgp-dp-down"
            />
            <div className="mgp-dp-hub" aria-hidden="true">
              <span className="mgp-dp-hub-gem" />
            </div>
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
              className="mgp-ab mgp-ab-b"
              icon={
                <>
                  <span className="mgp-ab-ring" />
                  <span className="mgp-ab-letter">B</span>
                </>
              }
            />
            <GamepadButton
              code={keyMap.a}
              label="A"
              className="mgp-ab mgp-ab-a"
              icon={
                <>
                  <span className="mgp-ab-ring" />
                  <span className="mgp-ab-letter">A</span>
                </>
              }
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 8,
            width: '100%',
            marginTop: 12,
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
    </div>
  );
}

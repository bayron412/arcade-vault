# SPEC 10 — Controles táctiles para dispositivos móviles

> **Estado:** implementado
> **Depende de:** 05-asteroids-game, 07-tetris-game, 08-arkanoid-game, 09-snake-game
> **Fecha:** 2026-05-21
> **Objetivo:** Añadir controles táctiles (gamepad virtual) y layout adaptado a los
> cuatro juegos existentes (Asteroids, Tetris, Arkanoid, Snake) en pantallas < 768 px,
> sin modificar la experiencia de escritorio.

---

## Scope

**In:**

- Crear `components/MobileGamepad.tsx` — componente `"use client"` reutilizable que
  renderiza el gamepad virtual: D-pad (4 flechas) + 2 botones de acción (A, B) + un
  `<select>` nativo de skin + botón PAUSA + botón SALIR (vuelve a la pantalla de
  detalle del juego, `/games/[id]`). Solo visible en pantallas `< md` (< 768 px) via
  Tailwind.
- Cada pulsación del gamepad despacha un `KeyboardEvent` sintético en `document`
  (`new KeyboardEvent('keydown', { key: '...', bubbles: true })`), reutilizando los
  listeners de teclado ya existentes en cada componente de juego sin modificarlos.
- Modificar las cuatro play-pages para:
  - Ocultar completamente el HUD de React (JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, selector
    de skin, botones PAUSA / FIN / SALIR) en `< md`.
  - Escalar el canvas para que quepa en pantalla (CSS `width: 100%; height: auto` +
    `aspect-ratio` preservado) en `< md`.
  - Renderizar `<MobileGamepad>` debajo del canvas en `< md`, pasándole la función de
    pausa, la función de salir (`router.push('/games/<id>')`), el skin actual y el
    setter de skin.
- Mapeo de botones por juego (valores = `KeyboardEvent.code`, ya que los cuatro
  componentes de juego escuchan `e.code`, no `e.key`):
  - **Asteroids:** D-pad ↑ = `ArrowUp` (empuje), ← = `ArrowLeft`, → = `ArrowRight` |
    A = `Space` (disparar), B = sin acción (el juego no tiene hiperespacio implementado).
  - **Tetris:** D-pad ← → = `ArrowLeft` / `ArrowRight`, ↓ = `ArrowDown` |
    A = `Space` (hard drop — cae de una), B = `ArrowUp` (voltear/rotar).
  - **Arkanoid:** D-pad ← → = `ArrowLeft` / `ArrowRight` | A y B = sin acción
    (el juego no tiene mecánica de lanzar bola: la bola se mueve automáticamente
    al cargar el nivel).
  - **Snake:** D-pad ↑↓←→ = `KeyW` / `KeyS` / `KeyA` / `KeyD` | A y B = sin acción.
  - `MobileGamepad` siempre renderiza los 6 botones (D-pad ↑↓←→ + A + B) en los cuatro
    juegos. Si un juego no define una tecla para alguno (`keyMap` sin esa entrada), el
    botón se muestra deshabilitado (`disabled`, atenuado al 30% de opacidad,
    `cursor: not-allowed`) en vez de ocultarse — el jugador ve el layout completo del
    control incluso si algún botón no hace nada en ese juego.

**Fuera de alcance:**

- Modificar los componentes canvas (`AsteroidsGame`, `TetrisGame`, `ArkanoidGame`,
  `SnakeGame`) — los eventos sintéticos reutilizan sus listeners existentes.
- Soporte táctil para juegos futuros — cada nuevo juego lo define en su propio spec.
- Gestos swipe — se descartaron en favor del D-pad visual para mayor precisión.
- Botón FIN en el gamepad — solo se incluye SALIR (vuelve a `/games/[id]`); terminar
  la partida sigue el flujo normal del juego (game over) o el botón nativo del navegador.
- Orientación landscape — solo se soporta portrait en este spec.
- Haptic feedback.

---

## Data model

No se introducen nuevas tablas ni tipos TypeScript.

### Props de `MobileGamepad`

```ts
interface KeyMap {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  a?: string;
  b?: string;
}

interface SkinOption {
  id: string;
  label: string;
}

interface MobileGamepadProps {
  keyMap: KeyMap;
  paused: boolean;
  onPauseToggle: () => void;
  onExit: () => void;
  skin: string;
  skinOptions: SkinOption[];
  onSkinChange: (skin: string) => void;
}
```

El selector de skin en móvil es un `<select>` nativo (no la fila de botones del HUD de
escritorio) para ahorrar espacio horizontal junto a PAUSA y SALIR.

### Mapeo de teclas (definido en cada play-page, pasado como prop)

Los valores son `KeyboardEvent.code` (no `.key`), porque los cuatro componentes
de juego (`AsteroidsGame`, `TetrisGame`, `ArkanoidGame`, `SnakeGame`) leen
`e.code` en sus listeners de teclado existentes.

```ts
// app/games/asteroids/play/page.tsx
const keyMap: KeyMap = {
  up: 'ArrowUp',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'Space',
  // sin 'b': el juego no tiene hiperespacio implementado
};

// app/games/tetris/play/page.tsx
const keyMap: KeyMap = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'Space',
  b: 'ArrowUp',
};

// app/games/arkanoid/play/page.tsx
const keyMap: KeyMap = { left: 'ArrowLeft', right: 'ArrowRight' };
// sin 'a' ni 'b': el juego no tiene mecánica de lanzar bola

// app/games/snake/play/page.tsx
const keyMap: KeyMap = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
};
```

`MobileGamepad` solo despacha las teclas que recibe — sin conocer los juegos existentes.
Juegos futuros definen su propio `keyMap` sin tocar el componente.

---

## Implementation plan

1. **Crear `components/MobileGamepad.tsx`**
   - Renderiza el layout del gamepad:
     - Fila superior: D-pad (cruz de 4 botones) a la izquierda + botones A y B a la derecha.
     - Fila inferior: `<select>` de skin + botón PAUSA + botón SALIR.
   - Cada botón usa Pointer Events (`onPointerDown` / `onPointerUp` / `onPointerCancel`
     con `setPointerCapture`) para despachar el `KeyboardEvent` sintético con la tecla
     correspondiente del `KEY_MAP` — no `onTouchStart`/`onMouseDown`, porque React marca
     los listeners táctiles como pasivos por defecto y `preventDefault()` no siempre
     bloquea el clic de compatibilidad diferido del navegador, lo que puede robar el foco
     hacia otro botón (ej. PAUSA) y perder eventos del D-pad. Todos los botones (D-pad y
     A/B) despachan `keyup` en la liberación, no solo los de movimiento — de lo contrario
     la lógica "just pressed" de algunos juegos (ej. disparo en Asteroids) solo dispara
     una vez y luego queda bloqueada.
   - El componente completo tiene `className="flex md:hidden ..."` — invisible en escritorio.
   - Verificación: en DevTools con viewport móvil, el gamepad aparece y las pulsaciones
     se registran en la consola al añadir un listener temporal en `document`.

2. **Adaptar `app/games/asteroids/play/page.tsx`**
   - Envolver el HUD de React existente en `<div className="hidden md:block">`.
   - Escalar el canvas: añadir `className="w-full h-auto max-w-[800px]"` al wrapper del canvas.
   - Añadir `<MobileGamepad gameId="asteroids" ... />` debajo del canvas, visible solo en `< md`.
   - Pasar `paused`, `onPauseToggle`, `onExit` a `MobileGamepad`.
   - Verificación: en viewport 390 px el HUD React desaparece, el canvas escala y el
     gamepad aparece; disparar con botón A genera proyectiles.

3. **Adaptar `app/games/tetris/play/page.tsx`** — igual que paso 2 con `gameId="tetris"`.
   - Verificación: rotar pieza con botón A y bajar rápido con D-pad ↓ funciona.

4. **Adaptar `app/games/arkanoid/play/page.tsx`** — igual que paso 2 con `gameId="arkanoid"`.
   - Verificación: mover paleta con D-pad ← → y lanzar bola con A funciona.

5. **Adaptar `app/games/snake/play/page.tsx`** — igual que paso 2 con `gameId="snake"`.
   - Verificación: cambiar dirección con el D-pad funciona; la serpiente no invierte 180°.

6. **Verificación final** — `npm run build` sin errores. En escritorio (> 768 px) el HUD
   React y los controles de teclado funcionan exactamente igual que antes.

---

## Acceptance criteria

- [ ] `MobileGamepad` es invisible en viewport ≥ 768 px (escritorio sin cambios).
- [ ] En viewport < 768 px el HUD React (JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, SKIN, botones
      PAUSA/SALIR) está oculto en los cuatro juegos.
- [ ] El canvas escala para caber en pantalla móvil sin scroll horizontal.
- [ ] El gamepad virtual aparece debajo del canvas en los cuatro juegos en móvil.
- [ ] `MobileGamepad` siempre muestra los 6 botones (↑↓←→ + A + B) en los cuatro juegos;
      los que no tienen acción en ese juego se ven deshabilitados/atenuados en vez de
      ocultarse.
- [ ] El D-pad de Asteroids mueve la nave (← → rotan, ↑ empuje continuo mientras se mantiene pulsado); ↓ está deshabilitado.
- [ ] El botón A de Asteroids dispara; el botón B está deshabilitado (el juego no tiene hiperespacio).
- [ ] El D-pad de Tetris mueve la pieza horizontalmente y la baja rápido con ↓.
- [ ] El botón A de Tetris ejecuta hard drop (la pieza cae de una); el botón B la rota.
- [ ] El D-pad de Arkanoid mueve la paleta horizontalmente; ↑ y ↓ están deshabilitados;
      los botones A y B están deshabilitados (el juego no tiene mecánica de lanzar bola).
- [ ] El D-pad de Snake cambia la dirección (sin permitir giro de 180°); los botones A y B
      están deshabilitados.
- [ ] El botón PAUSA del gamepad pausa y reanuda el juego en los cuatro juegos.
- [ ] El botón SALIR del gamepad navega a `/games/<id>` en los cuatro juegos.
- [ ] El `<select>` de skin del gamepad cambia el skin del juego activo y persiste en
      `localStorage` igual que el HUD de escritorio.
- [ ] El botón PAUSA no se resalta (glow de `:hover`) por sí solo durante el juego en
      dispositivos táctiles.
- [ ] En escritorio, el HUD React, los controles de teclado y el mouse funcionan igual que antes.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: KeyboardEvent sintético** — el gamepad despacha eventos de teclado sintéticos en
  `document` en lugar de añadir props/callbacks a los componentes de juego. Razón: cero
  cambios en los cuatro componentes canvas; toda la lógica táctil queda encapsulada en
  `MobileGamepad`.

- **Sí: D-pad visual + 2 botones** — en lugar de swipe/joystick analógico. Razón: mayor
  precisión en juegos de arcade que requieren pulsaciones discretas; el usuario confirmó
  este diseño.

- **Sí: `md` (768 px) como breakpoint** — estándar de Tailwind, coherente con el resto de
  la plataforma.

- **Sí: PAUSA + SALIR + `<select>` de skin en el gamepad** — a petición del usuario
  durante la implementación se agregó un botón SALIR junto a PAUSA (en móvil no había
  forma de volver a la biblioteca sin el HUD), y el selector de skin del HUD de
  escritorio (fila de botones) se reemplazó por un `<select>` nativo compacto para no
  perder esa funcionalidad sin ocupar el espacio de una fila de botones.

- **Sí: `.btn:hover` restringido a `@media (hover: hover) and (pointer: fine)`** —
  descubierto durante la implementación: en dispositivos táctiles, `:hover` se queda
  "pegado" en el último elemento tocado (o uno que el dedo rozó) porque no hay
  `mouseout` que lo limpie — esto hacía que el botón PAUSA se iluminara solo en medio
  de la partida sin haber sido presionado. Se restringió el glow de `:hover` de `.btn`
  (usado en todo el sitio, no solo en el gamepad) a dispositivos con puntero fino real;
  el hover de escritorio no cambia.

- **Sí: Pointer Events con `setPointerCapture` en vez de touch/mouse events** — descubierto
  durante la implementación: usar `onTouchStart`/`onMouseDown`/`onMouseUp`/`onMouseLeave`
  provocaba que, en dispositivos táctiles reales, el clic de compatibilidad diferido del
  navegador aterrizara sobre otro botón (ej. PAUSA), robando el foco y perdiendo eventos
  del D-pad. `setPointerCapture` fija el gesto completo al botón presionado sin importar
  hacia dónde se mueva el dedo.

- **No: Modificar componentes de juego** — los canvas no reciben props táctiles nuevos;
  los eventos sintéticos reutilizan el código existente sin riesgo de regresión.

- **No: Soporte landscape** — orientación portrait únicamente en este spec. Landscape puede
  tratarse en un spec futuro si hay demanda.

- **No: Juegos futuros** — el soporte táctil de nuevos juegos se define en cada spec
  individual.

- **Sí: `KeyMap` usa `.code`, no `.key`** — descubierto durante la implementación: los
  cuatro componentes de juego existentes escuchan `e.code` en sus listeners, no `e.key`.
  El spec original usaba valores de `.key` (`' '`, `'w'`, `'z'`, `'Shift'`) que no
  coinciden con ningún `case` real. Corregido a valores `.code` (`'Space'`, `'KeyW'`,
  etc.) para que los eventos sintéticos realmente disparen la lógica del juego.

- **No: Hiperespacio en Asteroids** — el componente `AsteroidsGame` no implementa
  hiperespacio/teletransporte; no existe ningún listener para ello. En vez de añadir
  la mecánica al canvas (fuera de alcance de este spec), el botón B se muestra
  deshabilitado en Asteroids (el `keyMap` no define `b`).

- **Sí: A/B de Tetris = hard drop/voltear** — a petición del usuario durante la
  implementación, se cambió el mapeo original (A = rotar, B = hard drop) a
  A = `Space` (hard drop, cae de una), B = `ArrowUp` (voltear/rotar). Se probó
  primero A = `ArrowDown` (un solo paso), pero el usuario aclaró que quería la
  caída instantánea, no un paso equivalente al D-pad ↓.

- **No: Lanzar bola en Arkanoid** — el componente `ArkanoidGame` no tiene una mecánica
  de "bola pegada a la paleta, se lanza al pulsar". La bola se mueve automáticamente
  al cargar cada nivel (`loadLevel`). Los botones A, B, ▲ y ▼ se muestran deshabilitados
  en Arkanoid (el `keyMap` solo define `left`/`right`).

- **Sí: siempre mostrar los 6 botones, deshabilitados si no aplican** — a petición del
  usuario durante la implementación, se cambió el comportamiento de "ocultar botones sin
  acción" (decisiones anteriores) a "mostrar siempre los 6 botones, deshabilitados
  (`disabled`, opacidad 30%) cuando el juego no define esa tecla en el `keyMap`". El
  jugador ve el layout completo del control en los cuatro juegos; los botones
  deshabilitados no reciben eventos de puntero (bloqueado nativamente por el atributo
  `disabled`) y no despachan ningún `KeyboardEvent`.

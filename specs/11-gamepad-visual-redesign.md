# SPEC 11 — Rediseño visual del gamepad móvil (D-pad + A/B)

> **Estado:** Aprobado
> **Depende de:** 10-mobile-touch-controls
> **Fecha:** 2026-07-16
> **Objetivo:** Rediseñar visualmente el D-pad y los botones A/B de `MobileGamepad.tsx`
> con el estilo neón de `references/gamepad-assets/gamepad.html` (panel con glow,
> flechas SVG, hub animado, anillos en A/B), sin alterar ninguna funcionalidad,
> mapeo de teclas, tamaño de los controles ni el resto del componente (skin/PAUSA/SALIR).

---

## Scope

**In:**

- Rediseñar visualmente, dentro de `components/MobileGamepad.tsx`, únicamente:
  - El D-pad: cambiar los 4 botones de caracteres de texto (▲▼◀▶) a iconos SVG
    (triángulos rellenos, mismo path que la referencia), con el hub central
    (rombo `--cyan` con animación de pulso `pulse-led`) reemplazando el hueco
    vacío del grid actual.
  - Los botones A y B: aplicar el estilo circular con gradiente radial, borde
    `currentColor`, glow (`box-shadow`) y anillo punteado (`.ab-ring`) que
    aparece en press/hover, igual que la referencia.
  - Envolver **todo el gamepad** (D-pad + A/B **y** la fila de skin/PAUSA/SALIR)
    en un único panel contenedor con el estilo `.gp` de la referencia: fondo
    degradado oscuro, borde `--cyan` tenue, `border-radius`, `box-shadow` de
    glow externo. La fila de skin/PAUSA/SALIR pasa a vivir dentro de esa caja
    (antes quedaba debajo, sin panel), pero conserva exactamente su estilo
    actual (`<select>` y botones `.btn` sin cambios) — solo cambia su
    contenedor, no su apariencia.
  - Intercambiar el color de A y B para igualar la referencia: **B = cian
    (`--cyan`), A = magenta (`--magenta`)** — invierte los colores actuales
    (hoy B es magenta y A es cian), pero el mapeo de teclas de cada botón
    (`keyMap.a` → botón A, `keyMap.b` → botón B) no cambia.
  - Añadir el glow al estado presionado/activo del D-pad (`filter: drop-shadow`
    en el SVG) y el estado `on`/`:active` de A/B, igual que la referencia.
  - Conservar el estado `disabled` (opacidad 30%, `cursor: not-allowed`) para
    los botones sin tecla asignada en el `keyMap`, adaptado a los nuevos estilos.

**Fuera de alcance:**

- Cambiar tamaños/dimensiones del D-pad o de los botones A/B — se mantiene el
  footprint actual (~144px D-pad, ~48px A/B) para no reducir el espacio del
  canvas en móvil.
- Modificar el selector de skin, el botón PAUSA o el botón SALIR — mantienen su
  estilo actual sin cambios.
- Modificar `keyMap`, el despacho de `KeyboardEvent` sintéticos, o cualquier
  componente de juego (`AsteroidsGame`, `TetrisGame`, `ArkanoidGame`,
  `SnakeGame`) o play-page — cero cambios funcionales.
- Cambiar fuentes o añadir nuevas dependencias — se usan los tokens ya
  existentes en `app/globals.css` (`--cyan`, `--magenta`, `--bg-3`, `--ink*`,
  `--pixel`, `--mono`).
- Rediseño de escritorio — `MobileGamepad` ya es invisible en `≥ 768px`
  (`md:hidden`), este spec no cambia ese comportamiento.

---

## Data model

No se introducen nuevas estructuras de datos ni se modifica la interfaz `MobileGamepadProps` / `KeyMap` / `SkinOption` — es un cambio puramente visual dentro del JSX/estilos existentes de `components/MobileGamepad.tsx`.

---

## Implementation plan

1. **Agregar el sub-componente de icono SVG de flecha** dentro de
   `components/MobileGamepad.tsx` (reemplaza el `label` de texto ▲▼◀▶ del
   D-pad), reutilizando los mismos `path` que `references/gamepad-assets/gamepad.html`.
   - Verificación: las 4 flechas del D-pad se ven como triángulos SVG en vez
     de caracteres de texto.

2. **Rediseñar el D-pad**: envolver los 4 `GamepadButton` en un contenedor
   `gp-dpad` con posicionamiento absoluto (igual layout que la referencia:
   arriba/abajo/izq/der + hub central), aplicar el fondo degradado, borde y
   `box-shadow` de `.dp` a cada botón, y añadir el hub central (`.dp-hub` +
   `.dp-hub-gem` con la animación `pulse-led`) en el centro de la cruz.
   Mantener el tamaño total en ~144px (footprint actual) y el estado
   `disabled` (opacidad 30%) para flechas sin tecla asignada.
   - Verificación: el D-pad ocupa el mismo espacio que antes; al presionar
     una flecha habilitada, el icono brilla (glow cian) y la tecla sintética
     se sigue disparando (probar con Tetris moviendo pieza).

3. **Rediseñar A/B**: aplicar el estilo circular `.ab` (gradiente radial,
   borde `currentColor`, `box-shadow` de glow, anillo `.ab-ring`) a los
   botones A y B, intercambiando los colores: B = `--cyan`, A = `--magenta`.
   Mantener el tamaño actual (~48px) y el estado `disabled`.
   - Verificación: en Tetris, el botón A (magenta) sigue haciendo hard drop y
     el botón B (cian) sigue rotando — el color cambió, la función no.

4. **Envolver todo el gamepad en el panel `.gp`**: agregar el contenedor con
   fondo degradado oscuro, borde `--cyan` tenue y `box-shadow` de glow
   externo alrededor de ambas filas (D-pad/A-B **y** skin/PAUSA/SALIR), de
   modo que las dos queden dentro de la misma caja. La fila de skin/PAUSA/SALIR
   mantiene su estilo actual (`.btn`, `<select>`) sin cambios visuales propios.
   - Verificación visual: todo el gamepad (D-pad, A/B, selector de skin,
     PAUSA, SALIR) se ve agrupado dentro de un único panel con borde/glow,
     coherente con `gamepad-neon.png`; los controles de la fila inferior
     conservan su apariencia actual.

5. **Verificación final en los 4 juegos** (Asteroids, Tetris, Arkanoid,
   Snake) en viewport < 768px: el nuevo diseño se ve correctamente, todos los
   mapeos de teclas funcionan igual que antes de este spec, los botones
   deshabilitados se ven atenuados, y `npm run build` no tiene errores.

---

## Acceptance criteria

- [ ] Las flechas del D-pad se renderizan como iconos SVG (no caracteres de texto).
- [ ] El D-pad tiene un hub central con animación de pulso continuo (rombo cian).
- [ ] Los botones A y B tienen forma circular con gradiente radial, borde y glow,
      coincidiendo visualmente con `gamepad-neon.png`.
- [ ] El botón B es cian (`--cyan`) y el botón A es magenta (`--magenta`).
- [ ] Todo el gamepad (D-pad, A/B, selector de skin, PAUSA, SALIR) está
      envuelto en un único panel con fondo degradado, borde y glow externo.
- [ ] Al presionar una flecha del D-pad habilitada, el icono muestra glow
      (drop-shadow) y se dispara el `KeyboardEvent` correspondiente, igual que antes.
- [ ] Al presionar A o B, el anillo punteado aparece y se dispara el
      `KeyboardEvent` correspondiente a la tecla mapeada en `keyMap`, igual que antes.
- [ ] Los botones sin tecla asignada en `keyMap` se muestran deshabilitados
      (opacidad reducida, `cursor: not-allowed`) y no despachan ningún evento.
- [ ] El tamaño total del D-pad (~144px) y de los botones A/B (~48px) no cambió
      respecto a la versión anterior.
- [ ] El selector de skin, el botón PAUSA y el botón SALIR conservan su estilo
      actual (sin restilizarse) aunque ahora vivan dentro del panel envolvente.
- [ ] En los 4 juegos (Asteroids, Tetris, Arkanoid, Snake), en viewport < 768px,
      todos los mapeos de botones funcionan igual que antes (mismo comportamiento
      documentado en `specs/10-mobile-touch-controls.md`).
- [ ] `MobileGamepad` sigue siendo invisible en viewport ≥ 768px (sin cambios en
      `md:hidden`).
- [ ] Ningún componente de juego (`AsteroidsGame`, `TetrisGame`, `ArkanoidGame`,
      `SnakeGame`) ni ninguna play-page fue modificado.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: rediseño visual limitado a D-pad + A/B, pero panel envolvente para
  todo el gamepad** — el usuario aclaró, durante la definición, que el
  restilo visual (SVG, colores, hub, anillos) solo aplica a D-pad + A/B, pero
  que quiere que PAUSA, SALIR y el selector de skin se muevan dentro del
  mismo panel con borde/glow (`.gp`) en vez de quedar debajo de él. La fila
  inferior conserva su estilo actual (`.btn`, `<select>`) — solo cambia su
  contenedor.

- **Sí: intercambiar colores de A/B para igualar la referencia** — el usuario
  pidió igualar el diseño a la referencia (B = cian, A = magenta) y adaptar
  la funcionalidad para que siga funcionando igual. Esto es un cambio de
  color puro: el mapeo `keyMap.a` → botón A y `keyMap.b` → botón B no cambia,
  solo qué color tiene cada letra.

- **No: escalar tamaños a los de la referencia** — el usuario prefirió
  mantener el footprint actual (~144px D-pad, ~48px A/B) en vez de los
  tamaños más grandes de `gamepad.html` (156px/74px), para no reducir el
  espacio disponible para el canvas del juego en pantallas móviles pequeñas.

- **Sí: incluir animaciones (hub con pulso + anillos en A/B)** — el usuario
  confirmó que quiere fidelidad 1:1 con la referencia en las animaciones; el
  costo de rendimiento es CSS puro y no afecta el loop del juego en canvas.

- **Sí: iconos SVG en vez de caracteres de texto en el D-pad** — más nítido y
  consistente entre navegadores/dispositivos que depender de la fuente para
  renderizar ▲▼◀▶; confirmado por el usuario.

- **No: modificar componentes de juego o play-pages** — el spec 10 ya
  estableció que `MobileGamepad` despacha `KeyboardEvent` sintéticos
  reutilizando los listeners existentes; este spec es puramente de estilo y
  no requiere tocar esa integración.

- **Sin sección de riesgos** — es un cambio de estilo aislado a un solo
  componente, sin tocar lógica de juego ni persistencia; no se identifican
  riesgos relevantes más allá de verificación visual manual.

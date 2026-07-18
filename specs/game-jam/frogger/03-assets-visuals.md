# SPEC GAME-JAM — Assets & Visuals: FROGGER

> **Estado:** Implementado
> **Depende de:** 01-core-game.md
> **Fecha:** 2026-07-14
> **Objetivo:** Definir la identidad visual de FROGGER — todo dibujado con primitivas de
> canvas, sin sprites ni audio externos — y el wiring del cover y del HUD React de la
> plataforma.

---

## Scope

**In:**

- Paleta de color y estética de todos los elementos del juego (rana, vehículos, troncos,
  tortugas, agua, carretera, césped, metas) usando únicamente primitivas de Canvas 2D
  (`fillRect`, `arc`, `roundRect`, gradientes) y las variables CSS de la plataforma
  (`--cyan`, `--green`, `--magenta`, `--yellow`, `--ink`, etc.) traducidas a valores hex
  dentro del componente.
- Reutilización de la clase de cover `.cover-rana`, ya presente en `app/globals.css`
  (línea ~817) y sin usar por ningún juego implementado — su gradiente azul-verde con
  franjas horizontales y un círculo verde central ya representa visualmente un río con
  una rana, encaja de forma directa con FROGGER.
- HUD React de la plataforma (patrón de doble HUD: canvas + React) mostrando score,
  vidas y nivel en tiempo real.

**Fuera de alcance:**

- Sprites o spritesheets externos (PNG) — N/A, todo se dibuja con primitivas de canvas.
- Efectos de sonido o música — N/A, no se introduce audio en este MVP.
- Nueva clase de cover CSS — se reutiliza `.cover-rana`, ya existente.
- Animaciones complejas (partículas, shaders) — se limita a transformaciones simples
  (escala/opacidad) para el salto de la rana y el splash al ahogarse.

---

## Data model

N/A para assets externos — no hay sprites ni sonidos que copiar a `public/`. Los únicos
"datos visuales" son constantes de color y geometría dentro del propio componente:

```ts
const COLORS = {
  grassStart: '#0a2a1a',
  grassMedian: '#0a2a1a',
  road: '#1a1a24',
  water: '#001a2a',
  home: '#0a3a2a',
  hedge: '#0a4a2a',
  frog: '#00ff88', // var(--green)
  frogEye: '#0a0a18',
  car: '#ff006e', // var(--magenta)
  truck: '#f5ff00', // var(--yellow)
  bike: '#00f5ff', // var(--cyan)
  logWood: '#8a5a2a',
  turtle: '#00ff88',
  turtleSubmerged: 'rgba(0,255,136,0.25)',
  hud: '#e8e8f0', // var(--ink)
  timerBar: '#00f5ff', // var(--cyan)
};
```

Clase de cover reutilizada (ya existente en `app/globals.css`):

```css
.cover-rana {
  background: linear-gradient(180deg, #001f2a, #0a0a18);
}
.cover-rana::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 245, 255, 0.18) 0 20px,
      transparent 20px 40px
    ),
    radial-gradient(circle at 50% 55%, var(--green) 0 14px, transparent 15px);
  filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.5));
}
```

---

## Implementation plan

1. **Definir constantes de color dentro de `FroggerGame.tsx`** — trasladar la paleta del
   data model a una constante `COLORS` en TypeScript, evitando leer `getComputedStyle`
   sobre variables CSS en cada frame (por rendimiento del game loop).
   Verificación: el canvas se renderiza con la paleta neón consistente con el resto de
   la plataforma (magenta/cian/amarillo/verde sobre fondo oscuro).

2. **Dibujar el tablero por capas** en cada `draw()`:
   - Fondo por fila: césped (salida, mediana, metas) vs. asfalto (carretera) vs. agua
     (río), con `fillRect` por fila completa.
   - Setos de la fila de meta: `fillRect` en las columnas no ocupadas por las 5 casillas
     de meta, con un patrón de textura simple (líneas diagonales cortas).
   - Vehículos: rectángulos redondeados (`roundRect`) de distinto ancho según tipo
     (auto, camión, moto), color por tipo (`COLORS.car`/`truck`/`bike`), con un pequeño
     brillo (`shadowBlur`) para el efecto neón de la plataforma.
   - Troncos: rectángulos alargados color madera con una línea central más oscura
     (efecto de veta).
   - Tortugas: pares/tríos de elipses verdes superpuestas; en estado sumergido se dibujan
     con opacidad reducida (`COLORS.turtleSubmerged`) y sin colisión válida.
   - Rana: un cuerpo circular verde con dos ojos (círculos blancos con pupila oscura)
     orientados según la última dirección de salto, y un ligero `scale()` hacia arriba
     durante los `HOP_ANIMATION_MS` del salto para dar sensación de brinco.
   - Splash de ahogo: un breve efecto de círculos concéntricos semitransparentes en la
     posición de la rana antes de reposicionarla en la fila de salida.
     Verificación: cada elemento es visualmente distinguible (vehículo vs. tronco vs.
     tortuga vs. rana) a simple vista, sin necesidad de assets externos.

3. **Dibujar HUD interno del canvas** — score, vidas (iconos ♥ dibujados con `fillText` o
   `arc`), nivel y una barra de temporizador (`fillRect` cuyo ancho decrece con el tiempo
   restante, color `COLORS.timerBar`) en la esquina superior del canvas, con tipografía
   monoespaciada consistente con el resto de HUDs internos (Tetris/Arkanoid).
   Verificación: el HUD interno es legible sobre el fondo del tablero en todas las filas.

4. **Wiring del cover** — confirmar que el INSERT de `games` (spec 02) usa
   `cover: 'cover-rana'`; no se crean estilos nuevos en `app/globals.css`.
   Verificación: la card de FROGGER en `/games` y `/games/frogger` renderiza el gradiente
   azul-verde con franjas horizontales y el círculo verde central ya definidos.

5. **HUD React de la plataforma** — en `app/games/frogger/play/page.tsx`, mostrar
   `score`, `lives` (iconos `'♥ '.repeat(lives).trim()`, mismo patrón que Asteroids) y
   `level` (`String(level).padStart(2, '0')`), reutilizando las clases `.hud-stat`,
   `.lives`, `.level` ya presentes en el CSS global.
   Verificación: el HUD React refleja los mismos valores que el HUD interno del canvas
   en tiempo real.

---

## Acceptance criteria

- [x] Todos los elementos visuales del juego (rana, vehículos, troncos, tortugas, agua,
      carretera, césped, setos, metas) se dibujan con primitivas de Canvas 2D, sin
      ninguna imagen externa cargada vía `drawImage`.
- [x] La paleta de color usa los tonos neón ya establecidos en la plataforma
      (magenta/cian/amarillo/verde) sobre fondos oscuros, coherente con el resto de
      juegos.
- [x] La rana es visualmente distinguible de vehículos, troncos y tortugas en todo
      momento.
- [x] Las tortugas alternan entre estado visible y sumergido, y el estado sumergido se
      distingue visualmente (opacidad reducida) del estado flotante.
- [x] El HUD interno del canvas muestra score, vidas, nivel y una barra de temporizador
      legibles sobre el fondo del tablero.
- [x] La card de FROGGER en `/games` y `/games/frogger` usa `cover-rana` sin introducir
      ninguna clase CSS nueva.
- [x] El HUD React de la plataforma (`app/games/frogger/play/page.tsx`) refleja score,
      vidas y nivel en tiempo real, con el mismo patrón visual que Asteroids/Arkanoid.
- [x] No se añade ningún archivo a `public/games/frogger/` (no hay assets que copiar).

---

## Decisions

- **Sí: Todo dibujado con primitivas de canvas, sin sprites** — a diferencia de Snake
  (que reutiliza un atlas de frutas) o Arkanoid (que reutiliza un spritesheet), FROGGER
  no requiere ningún asset externo. Razón: la mecánica de Frogger se basa en formas
  geométricas simples (rectángulos, elipses, círculos) que se distinguen bien sin
  necesidad de arte pixelado; introducir sprites añadiría trabajo sin mejorar la
  jugabilidad del MVP.

- **Sí: Reutilizar `.cover-rana` existente** — la clase ya está en `app/globals.css` sin
  ningún juego implementado usándola, y su diseño (franjas tipo río + círculo verde
  central) ya representa visualmente el concepto de FROGGER. Razón: cero trabajo
  adicional de CSS y coherencia temática inmediata.

- **Sí: Constantes de color en TypeScript, no lectura de variables CSS en runtime** —
  se traduce la paleta a valores hex fijos en el propio componente. Razón: evitar
  `getComputedStyle` dentro del game loop por rendimiento; mismo patrón que
  `FRUIT_ATLAS` en Snake (constantes trasladadas, no leídas dinámicamente).

- **Sí: HUD interno + HUD React (doble HUD)** — el canvas dibuja su propio HUD
  (incluyendo el temporizador, que no sale del canvas) y React refleja
  score/vidas/nivel en el HUD de la plataforma. Razón: consistencia con
  Tetris/Arkanoid/Snake.

- **No: Sonido** — se descarta para este MVP. Razón: no es parte del core mínimo
  jugable de Frogger; se puede añadir en una iteración futura reutilizando el patrón de
  `ball-bounce.mp3`/`break-sound.mp3` de Arkanoid si se decide incorporar audio más
  adelante.

- **No: Nueva clase de cover** — `.cover-rana` ya cubre la necesidad visual. Razón:
  evitar CSS duplicado quedaría inconsistente con el resto de la plataforma, que ya
  tiene una clase preparada y sin usar para este concepto exacto.

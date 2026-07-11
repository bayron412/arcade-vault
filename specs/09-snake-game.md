# SPEC 09 — Integración del juego SNAKE

> **Estado:** Aprobado
> **Depende de:** 06-leaderboard-scores
> **Fecha:** 2026-07-11
> **Objetivo:** Integrar SNAKE como juego jugable en Arcade Vault, con mecánica de grid implementada desde cero y sprites de frutas del atlas `references/source-assets/snake-assets/`, conectando el leaderboard de Supabase.

---

## Scope

**In:**

- Insertar la fila `snake` en la tabla `games` de Supabase (seed manual vía SQL).
- Copiar `references/source-assets/snake-assets/fruits.png` a `public/games/snake/fruits.png`. `sprites.js` se usa únicamente como referencia de coordenadas del atlas al escribir el componente (no se copia tal cual; sus coordenadas `{x, y, w, h}` se trasladan a una constante TypeScript dentro del componente).
- Crear `components/games/SnakeGame.tsx` — componente React `"use client"` que encapsula el canvas y el game loop de Snake (grid 20×20, celdas de 30px, canvas 600×600). Acepta props `paused`, `onScoreChange`, `onLengthChange`, `onGameOver`.
- Mecánica implementada desde cero (no hay `game.js` de referencia, solo el atlas de sprites):
  - Serpiente se mueve en un grid discreto, un paso por tick.
  - Controles: flechas y WASD; se ignora cualquier input que intente invertir 180° sobre la dirección actual.
  - En cada spawn de comida se elige aleatoriamente una fruta del atlas (`apple`, `cherry`, `watermelon`, etc.) y se dibuja con `drawImage` recortando `fruits.png` según sus coordenadas.
  - Comer fruta incrementa `score` y `length` (longitud de la serpiente) en 1 segmento.
  - Game over: la cabeza choca contra su propia cola o contra el borde del tablero (sin wrap-around).
- Crear `app/games/snake/play/page.tsx` — play-page específica. Gestiona el estado (`score`, `length`, pausa, game over) y pasa callbacks al componente canvas.
- Wiring del modal de game over: pre-rellenar nombre desde `localStorage.getItem('av_player_name')`; al confirmar, guardar nombre en localStorage e insertar score en la tabla `scores` vía cliente browser.
- Botón de pausa de la plataforma pasa el flag `paused` al componente canvas, que congela el `update()` del loop (el `draw()` sigue pintando el último frame).
- El HUD React de la plataforma muestra `score` y `length` en tiempo real (sustituyendo a `lives`/`level`, que no aplican a Snake).

**Fuera de alcance:**

- Crear las tablas `games` o `scores` en Supabase — ya existen (spec 06).
- Supabase Auth — `user_id` se almacena como `null` en todos los scores.
- RLS (Row Level Security) — se configura en un spec futuro de seguridad.
- Realtime — el leaderboard no se actualiza en vivo; solo al cargar la página.
- Paginación del leaderboard — se muestran los top 10 fijos.
- Controles táctiles o mobile.
- Actualización automática de `best` y `plays` en la tabla `games` — campos estáticos.
- Wrap-around en los bordes del tablero — chocar contra el borde termina la partida.
- Añadir una nueva clase de cover CSS — se reutiliza `.cover-snake`, ya existente en `app/globals.css`.

---

## Data model

### Seed en Supabase — tabla `games`

Ejecutar en el SQL Editor de Supabase:

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'snake',
  'SNAKE',
  'Cada fruta te alarga. Cada error te termina.',
  'Guía tu serpiente por una cuadrícula infinita de neón, devorando frutas para crecer sin límite. Cada bocado la hace más larga y el margen de error más pequeño. Un solo giro en falso contra tu propia cola o el borde del tablero, y todo termina.',
  'ARCADE',
  'cover-snake',
  'green'
);
```

### Props del componente `SnakeGame`

```ts
interface SnakeGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLengthChange: (length: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

### Constante de atlas de sprites

Dentro de `components/games/SnakeGame.tsx`, una constante `FRUIT_ATLAS` traslada las coordenadas de `references/source-assets/snake-assets/sprites.js` (`fruits.apple`, `fruits.cherry`, etc. — 21 entradas `{ x, y, w, h }` sobre `fruits.png`, hoja de 3790×442px) a TypeScript, para recortar con `drawImage` sobre la imagen cargada desde `/games/snake/fruits.png`.

No se introducen nuevas tablas ni tipos TypeScript — se reutilizan `GameRow` y `ScoreRow` de `lib/supabase/types.ts`.

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT del data model en el SQL Editor de Supabase.
   Verificación: la fila `snake` aparece en el Table Editor; `/games` muestra la card de SNAKE
   con `cover-snake` y color `green`.

2. **Copiar assets** — copiar `references/source-assets/snake-assets/fruits.png` a
   `public/games/snake/fruits.png`. Trasladar las 21 entradas de coordenadas de
   `references/source-assets/snake-assets/sprites.js` a una constante `FRUIT_ATLAS`
   dentro de `components/games/SnakeGame.tsx` (sin copiar `sprites.js` tal cual, ya que
   depende de `window.SPRITE_ATLAS` en lugar de un módulo ES). Verificación: la imagen
   carga sin 404 en `/games/snake/fruits.png`.

3. **Crear `components/games/SnakeGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 600 × 600 con grid interno de 20 × 20 celdas de 30px.
   - Implementa el game loop desde cero: la serpiente arranca con longitud 3 en el centro
     del grid, se mueve un paso por tick (velocidad fija, ej. 8 ticks/segundo) en la
     dirección actual.
   - Controles: `ArrowUp/ArrowDown/ArrowLeft/ArrowRight` y `W/A/S/D` cambian la dirección
     del próximo tick; se ignora cualquier input que invierta 180° sobre la dirección actual
     (evita que la serpiente choque consigo misma por un giro instantáneo).
   - En cada spawn de comida elige una fruta aleatoria de `FRUIT_ATLAS` y la dibuja con
     `ctx.drawImage(img, fruit.x, fruit.y, fruit.w, fruit.h, dx, dy, cellSize, cellSize)`
     sobre una celda libre del grid (no ocupada por la serpiente).
   - Al comer fruta: incrementa `score` en 10 puntos, añade un segmento a la serpiente
     (`length += 1`) y genera una nueva fruta.
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no avanza
     el `update()` (la serpiente no se mueve).
   - Llama `onScoreChange` y `onLengthChange` cada vez que esos valores cambian dentro
     del loop (comparando con el valor anterior antes de disparar el callback).
   - Llama `onGameOver(score)` cuando la cabeza de la serpiente choca contra su propia cola
     o sale de los límites del grid (sin wrap-around).
   - No dibuja ningún overlay "GAME OVER" en el canvas — el modal React de la plataforma es
     el único indicador de fin de partida.
   - Limpia el listener de `keydown` en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/snake/play` y es jugable con flechas y WASD;
     comer fruta incrementa longitud y score; chocar termina la partida.

4. **Crear `app/games/snake/play/page.tsx`** — play-page específica:
   - Importa `SnakeGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `length` (inicial `3`), `paused`, `over`, `name`, `saved`, `gameKey`.
   - Pasa `paused` y los tres callbacks (`onScoreChange`, `onLengthChange`, `onGameOver`)
     a `SnakeGame`.
   - Al montar el modal de game over (`over === true`), lee
     `localStorage.getItem('av_player_name')` y pre-rellena el campo `name`.
   - Al confirmar, persiste el nombre en `av_player_name` e inserta en `scores`:
     `{ game_id: 'snake', player_name: name, score, user_id: null }`.
   - Marca `saved: true` para deshabilitar el botón y evitar doble inserción.
   - Reutiliza el mismo layout visual (HUD React con `score`/`length` en lugar de
     `lives`/`level`, CRT, modal game over) que `app/games/asteroids/play/page.tsx`.
     Verificación: el HUD React muestra `score` y `length` en tiempo real; tras una partida
     el score aparece en `/games/snake` y en `/hall-of-fame` al recargar.

5. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La card de SNAKE aparece en `/games` con `cover-snake` y color `green`.
- [ ] `/games/snake` carga con los datos reales del juego y el leaderboard top 10.
- [ ] `/games/snake/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas renderiza un grid 20×20 y es jugable con flechas y WASD.
- [ ] Un input que invertiría 180° la dirección actual se ignora (no causa colisión inmediata).
- [ ] La comida se dibuja usando un sprite aleatorio de `fruits.png` (no un cuadrado sólido).
- [ ] Comer una fruta incrementa `score` en 10 y `length` en 1, y genera una nueva fruta en una celda libre.
- [ ] El HUD React de la plataforma refleja en tiempo real `score` y `length`.
- [ ] El botón "PAUSA" congela el movimiento de la serpiente; "REANUDAR" lo reanuda.
- [ ] Chocar contra la propia cola termina la partida.
- [ ] Chocar contra el borde del tablero termina la partida (sin wrap-around).
- [ ] Al terminar la partida, aparece el modal React de game over con la puntuación final.
- [ ] El canvas no dibuja ningún overlay "GAME OVER" propio.
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero (longitud 3, score 0).
- [ ] Al abrir el modal, el campo de nombre se pre-rellena con `av_player_name` de localStorage si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón "GUARDAR PUNTUACIÓN" se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/snake` y en `/hall-of-fame` al recargar.
- [ ] Cuando no hay scores, el leaderboard muestra "Sé el primero en entrar al salón de la fama".
- [ ] `/hall-of-fame` muestra un tab para SNAKE.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Mecánica desde cero, sprites reutilizados** — no existe `game.js` de referencia para
  Snake, solo un atlas de sprites de frutas. Se implementa la lógica de grid/colisión desde
  cero y se reutiliza únicamente `fruits.png` para dibujar la comida. Razón: el atlas aporta
  valor visual real; inventar una mecánica de referencia inexistente no lo haría.

- **Sí: `length` reemplaza a `lives`/`level` en el HUD** — Snake no tiene vidas ni niveles
  naturalmente. Razón: la longitud de la serpiente es el indicador de progreso más directo
  del juego, y mantiene el contrato de "doble HUD" (canvas + React) sin campos vacíos.

- **Sí: `sprites.js` se traduce a una constante TypeScript, no se copia tal cual** — el archivo
  original expone `window.SPRITE_ATLAS` (patrón de script global de navegador), incompatible
  con el sistema de módulos de Next.js. Razón: evitar `<script>` inline o hacks de `window`
  dentro de un componente React.

- **Sí: Sin wrap-around en los bordes** — chocar contra el borde termina la partida. Razón:
  es el comportamiento más extendido y esperado del Snake clásico; el usuario lo confirmó
  explícitamente frente a la alternativa de wrap-around.

- **Sí: Doble HUD** — el canvas conserva su propio HUD interno (si lo dibuja) y React muestra
  `score`/`length` en el HUD de la plataforma. Razón: consistencia con Asteroids/Tetris/Arkanoid.

- **Sí: Callbacks como interfaz de comunicación** — `onScoreChange`, `onLengthChange`,
  `onGameOver`. Razón: desacoplamiento limpio; el componente canvas no sabe nada de React
  ni de la plataforma.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente.
  Razón: `canvas` y `requestAnimationFrame` no existen en el entorno Node.js de Next.js SSR.

- **Sí: Play-page específica `app/games/snake/play/page.tsx`** — en lugar de modificar la
  ruta genérica `[id]/play`. Razón: evita condicionales en la ruta genérica; Next.js App
  Router da prioridad a rutas estáticas sobre dinámicas.

- **Sí: Un único spec combinado (juego + leaderboard)** — las tablas `games` y `scores` ya
  existen; solo se añade la fila del juego y el wiring. Separarlos no aportaría valor visible.

- **No: Crear tablas nuevas por juego** — se reutilizan `games` y `scores` del spec 06.
  Razón: el modelo es suficientemente genérico para cualquier juego con score numérico.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: se mitiga en el spec futuro de seguridad.

- **No: Realtime en leaderboards** — los scores se ven al recargar.
  Razón: la complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.

- **No: Componente genérico `CanvasGame`** — cada juego tiene su componente propio.
  Razón: YAGNI; ya descartado en specs 07 y 08 por la misma razón.

- **No: Nueva clase de cover CSS** — se reutiliza `.cover-snake`, ya presente en
  `app/globals.css:719`. Razón: coincide temáticamente (verde, patrón de serpiente/comida)
  sin necesidad de trabajo adicional.

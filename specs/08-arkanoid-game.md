# SPEC 08 — Integración del juego Arkanoid

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (Asteroids integración), SPEC 06 (leaderboard/scores)
> **Fecha:** 2026-07-11
> **Objetivo:** Integrar el juego Arkanoid (canvas puro, referencia `references/started-games/04-arkanoid/`) como nuevo juego jugable en la plataforma, con HUD, pausa y leaderboard conectado a Supabase.

---

## Scope

**In:**

- Fila nueva `arkanoid` en la tabla `games` (INSERT, la tabla ya existe).
- Componente `components/games/ArkanoidGame.tsx` — port a React/TypeScript del canvas original (`game.js` + `levels.js` + `assets/spritesheet.js`), con props `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver` (mismo contrato que `AsteroidsGame`).
- Ruta específica `app/games/arkanoid/play/page.tsx` con HUD React, botón PAUSA/REANUDAR, modal de game over y guardado de score en Supabase.
- Copia de los assets necesarios (`spritesheet-breakout.png`, `spritesheet.js`, sonidos) a `public/` bajo un path propio de Arkanoid.
- Controles: mouse (mousemove sobre el canvas) + teclado (←/→) para mover la paleta.
- Pausa secundaria interna del canvas (tecla P/Esc + selector de nivel por clic) coexistiendo con la pausa de la plataforma vía prop `paused`.
- Card del juego en `/games` con `cover-bricks`, color `magenta`, cat `ARCADE`.
- Leaderboard top 10 en `/games/arkanoid` y aparición automática en `/hall-of-fame`.

**Out of scope (para futuros specs):**

- Componente genérico `CanvasGame` reutilizable (se evalúa cuando haya un patrón más confirmado — ya lo descartó también el spec 07).
- Edición o rebalanceo de los 5 niveles/velocidades originales.
- Leaderboard local en localStorage (se elimina si el juego original lo tuviera; en este caso no lo tenía).
- Nuevos efectos visuales o sonidos más allá de los ya presentes en la referencia.

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'arkanoid',
  'ARKANOID',
  'Destruye bloques antes de perder la bola.',
  'Controla la paleta, rebota la bola y destruye todos los bloques antes de quedarte sin vidas. Supera los 5 niveles, cada uno más rápido que el anterior, y compite por el puntaje más alto.',
  'ARCADE',
  'cover-bricks',
  'magenta'
);
```

### Props del componente `ArkanoidGame`

```ts
interface ArkanoidGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local del componente no introduce modelos persistentes. Las vidas arrancan en `3`
(igual que el original); al llegar a `0` o al completar el nivel 5 (`gameState === 'win'`)
se dispara `onGameOver(score)`.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `arkanoid` aparece en el Table Editor; `/games` muestra la card
   de Arkanoid con `cover-bricks` y color `magenta`.

2. **Copiar assets** — mover `assets/spritesheet-breakout.png`, `assets/spritesheet.js` y
   los sonidos (`ball-bounce.mp3`, `break-sound.mp3`) desde
   `references/started-games/04-arkanoid/assets/` a `public/games/arkanoid/`. Adaptar
   `spritesheet.js` para exponer `loadSpritesheet`, `drawSprite`, `drawFrame`,
   `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` como utilidades TypeScript importables
   (`components/games/arkanoid/spritesheet.ts`), apuntando la imagen a la nueva ruta
   pública. Verificación: el módulo compila sin errores de tipo.

3. **Crear `components/games/ArkanoidGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 800 × 600 centrado.
   - Porta la lógica completa de `game.js` + `levels.js` (paddle, ball, blocks, explosiones,
     5 niveles, colisiones AABB, sonidos) al game loop de React.
   - Recibe prop `paused: boolean` — si es `true`, `update(dt)` no se ejecuta (mismo
     patrón que Asteroids/Tetris), pero `draw()` sigue renderizando el último frame.
   - Conserva el control por mouse (`mousemove` sobre el canvas) y añade `←`/`→` como
     alternativa de teclado para mover la paleta.
   - Conserva la pausa secundaria del canvas (tecla `P`/`Esc` + clic en el selector de
     nivel 1–5 del overlay de pausa), independiente del prop `paused` de la plataforma.
   - Elimina `drawOverlay('GAME OVER')` y `drawOverlay('¡Completaste el juego!')` del
     `draw()` — ambos casos (`gameState === 'gameover'` y `gameState === 'win'`) disparan
     `onLivesChange(0)` seguido de `onGameOver(score)` en su lugar.
   - Llama `onScoreChange` y `onLevelChange` cuando esos valores cambian dentro del loop.
   - Conserva el HUD interno del canvas (score, vidas, nivel) sin modificaciones.
   - Limpia los listeners de `keydown`/`keyup`/`mousemove`/`click` en el `return` del
     `useEffect`.
     Verificación: el juego arranca en `/games/arkanoid/play` y es jugable con mouse y
     teclado.

4. **Crear `app/games/arkanoid/play/page.tsx`** — play-page específica:
   - Importa `ArkanoidGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `3`), `level`, `paused`, `over`, `name`, `saved`.
   - Pasa `paused` y los cuatro callbacks a `ArkanoidGame`.
   - Reutiliza el layout visual de la plataforma (HUD React + CRT + modal game over),
     igual que las play-pages de Asteroids y Tetris.
   - Modal game over: pre-rellena nombre desde `localStorage.getItem('av_player_name')`;
     al confirmar, guarda en `localStorage` e inserta en Supabase
     `{ game_id: 'arkanoid', player_name: name, score, user_id: null }`.
   - Botón de guardar se deshabilita tras el primer envío.
     Verificación: el HUD React refleja score, vidas y nivel en tiempo real.

5. **Verificación final** — `npm run build` termina sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `arkanoid` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Arkanoid aparece en `/games` con cover `cover-bricks` y color `magenta`.
- [ ] La ruta `/games/arkanoid/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas principal (800 × 600) se renderiza centrado.
- [ ] La paleta se mueve con el mouse y también con `←`/`→`.
- [ ] Los 5 niveles cargan en orden con velocidad creciente, igual que el original.
- [ ] Romper un bloque suma 10 puntos y dispara la animación de explosión y el sonido.
- [ ] Perder la bola resta una vida; al llegar a 0 vidas termina la partida.
- [ ] Completar el nivel 5 (`gameState === 'win'`) también termina la partida.
- [ ] El HUD interno del canvas (score, vidas, nivel) se dibuja correctamente durante la partida.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" de la plataforma congela `update(dt)`; "REANUDAR" lo reanuda.
- [ ] La tecla `P`/`Esc` sigue abriendo la pausa secundaria del canvas (selector de nivel por clic), de forma independiente al botón de la plataforma.
- [ ] Al producirse game over o win, `onLivesChange(0)` y `onGameOver(score)` se disparan; aparece el modal React de la plataforma con la puntuación final.
- [ ] Los overlays HTML "GAME OVER" y "¡Completaste el juego!" del canvas original no se muestran.
- [ ] El botón "JUGAR DE NUEVO" del modal reinicia la partida desde cero.
- [ ] Al terminar una partida, el modal pre-rellena el nombre desde `av_player_name` si existe.
- [ ] Al confirmar el nombre, el score se inserta en Supabase y el nombre se persiste en `localStorage`.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/arkanoid` (top 10) y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: 3 vidas** — se conserva el valor original del juego (a diferencia de Tetris, que
  usa 1 vida artificial). Arkanoid sí tiene vidas reales en su mecánica.

- **Sí: Win cuenta como game over** — completar el nivel 5 dispara el mismo flujo de fin
  de partida que perder. Razón: un solo camino de cierre simplifica la integración con el
  modal de guardado de score; no hay beneficio en modelar "victoria" distinto de "derrota"
  para efectos del leaderboard.

- **Sí: Mouse + teclado** — se preserva el control original por mouse y se añade `←`/`→`
  como alternativa. Razón: el juego original depende fuertemente del mouse para precisión;
  quitarlo degradaría la jugabilidad.

- **Sí: Pausa secundaria del canvas (P/Esc + selector de nivel) independiente del prop
  `paused`** — a diferencia de Tetris (que la elimina), aquí se conserva porque el
  selector de nivel por clic es una función de testing/exploración útil y no colisiona
  visualmente con el flujo de la plataforma (usa su propio overlay). Razón: decisión
  explícita del usuario, distinta al patrón de Tetris.

- **Sí: Assets copiados a `public/games/arkanoid/`** — el spritesheet y sonidos se mueven
  desde `references/` a `public/`, no se referencian in situ. Razón: `references/` no es
  servible por Next.js y no debe acoplarse al build de producción.

- **Sí: Play-page específica `app/games/arkanoid/play/page.tsx`** — en lugar de modificar
  la ruta genérica `[id]/play`. Razón: coherencia con Asteroids y Tetris; Next.js App
  Router da prioridad a rutas estáticas sobre dinámicas.

- **No: Componente genérico `CanvasGame`** — se sigue posponiendo. Razón: YAGNI, ya
  descartado en el spec 07; con tres casos aún no hay suficiente presión para abstraer bien.

- **No: Leaderboard local en localStorage** — el original no lo tenía, así que no aplica
  eliminarlo; se confirma que solo Supabase persiste scores, consistente con la plataforma.

- **No: Nuevos niveles, sonidos o efectos** — se porta exactamente lo que trae la
  referencia, sin ampliar contenido.

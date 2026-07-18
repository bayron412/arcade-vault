# SPEC GAME-JAM — Core Game: FROGGER

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-07-14
> **Objetivo:** Diseñar la mecánica completa de FROGGER, un clon fiel de Frogger (cruzar
> carretera y río salto a salto hasta llegar a la meta) implementado en canvas 2D puro,
> como nuevo juego jugable de Arcade Vault.

---

## Scope

**In:**

- Mecánica clásica de Frogger completa: una rana salta casilla a casilla desde una franja
  de salida, cruza una carretera con tráfico y un río con troncos/tortugas, y debe llegar
  a una de 5 casillas de meta (nido) en la fila superior.
- Grid discreto de 13 columnas × 13 filas, celdas de 40px → canvas de 520 × 520px.
- Distribución de filas (de abajo hacia arriba, índice de fila):
  - Fila 12 (inferior): franja de salida — segura, césped, punto de spawn de la rana.
  - Filas 7–11: 5 carriles de carretera con vehículos (autos, camiones, motos) moviéndose
    en direcciones alternas por carril; velocidad distinta por carril.
  - Fila 6: mediana — franja segura de césped entre carretera y río.
  - Filas 1–5: 5 carriles de río con troncos y tortugas moviéndose en direcciones alternas
    por carril; velocidad distinta por carril. Las tortugas se sumergen periódicamente
    (ciclo visible flotando/sumergida).
  - Fila 0 (superior): 5 casillas de meta (nido) separadas por setos, en columnas 0, 3, 6,
    9 y 12; el resto de la fila 0 es seto intransitable.
- Movimiento de la rana: salto discreto de una celda por pulsación de tecla (no movimiento
  continuo tipo Snake), con una breve animación de salto (~120ms) durante la cual se ignora
  nueva entrada.
- Controles: flechas y WASD — un salto por pulsación en la dirección correspondiente.
  La rana no puede salir de los límites horizontales del tablero ni retroceder más allá
  de la fila de salida.
- Física de río: al estar sobre un tronco o una tortuga (no sumergida), la rana se desplaza
  horizontalmente junto con la corriente del carril cada frame. Si la corriente empuja a la
  rana fuera de los límites horizontales del canvas, se pierde una vida.
- Colisión letal: pisar un carril de carretera y solapar con un vehículo; caer en un carril
  de río sin estar sobre tronco/tortuga (o sobre una tortuga sumergida); ser empujado fuera
  del tablero por la corriente; agotar el temporizador de vida.
- Temporizador por vida: cuenta regresiva de 25 segundos por intento, mostrada como barra
  interna en el HUD del canvas. Llegar a 0 resta una vida.
- Sistema de puntuación:
  - +10 puntos por cada salto hacia adelante (fila más alta nunca alcanzada en el intento
    actual) — evita farmear puntos moviéndose adelante y atrás.
  - +50 puntos al ocupar por primera vez una casilla de meta en el nivel actual.
  - Bono de tiempo al llegar a una meta: tiempo restante × 10.
  - +1000 puntos al ocupar las 5 casillas de meta (nivel completado).
- Progresión de nivel: al llenar las 5 casillas de meta, el nivel incrementa en 1, todos
  los carriles aumentan su velocidad ~15%, el tablero se reinicia (metas vacías, rana en
  la fila de salida) y el temporizador se reinicia a 25 segundos.
- Vidas: la partida arranca con 3 vidas. Al perder una vida (colisión, ahogo, tiempo
  agotado) con vidas restantes > 0, la rana vuelve a la fila de salida (columna central)
  conservando `score` y `level`; el temporizador se reinicia. Al llegar a 0 vidas, se
  dispara `onGameOver(score)`.
- HUD interno del canvas: score, vidas (iconos), nivel y barra de temporizador, dibujados
  con primitivas de canvas (patrón de doble HUD, igual que Tetris/Arkanoid).
- Componente `components/games/FroggerGame.tsx` y play-page
  `app/games/frogger/play/page.tsx`.

**Fuera de alcance:**

- Bonus especiales del Frogger original ajenos al core (mosca extra por tiempo, alligator
  lanes, lady frog) — se puede evaluar en una iteración futura, no en este MVP.
- Controles táctiles o mobile.
- Selector de skins o temas visuales alternativos.
- Menú de pausa interno del canvas — la pausa la controla exclusivamente la plataforma
  vía prop `paused`.
- Extracción de un componente genérico `CanvasGame` reutilizable.
- Supabase Auth y RLS — `user_id` se almacena como `null` (cubierto en spec 02).
- Realtime en el leaderboard (cubierto en spec 02).

---

## Data model

### Props del componente `FroggerGame`

```ts
interface FroggerGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

No se introducen tablas ni tipos TypeScript nuevos — se reutilizan `GameRow` y `ScoreRow`
de `lib/supabase/types.ts` (ver spec 02 para el INSERT concreto).

### Constantes internas del componente

Dentro de `FroggerGame.tsx`, sin persistencia externa:

```ts
const GRID_COLS = 13;
const GRID_ROWS = 13;
const CELL = 40; // px

const HOME_COLUMNS = [0, 3, 6, 9, 12]; // fila 0
const ROAD_ROWS = [7, 8, 9, 10, 11];
const RIVER_ROWS = [1, 2, 3, 4, 5];
const START_ROW = 12;
const MEDIAN_ROW = 6;

const LIFE_TIME_SECONDS = 25;
const HOP_ANIMATION_MS = 120;
const STARTING_LIVES = 3;
```

Cada carril de carretera y río se modela como un objeto en memoria del componente
(no persistente):

```ts
interface Lane {
  row: number;
  direction: 1 | -1; // 1 = derecha, -1 = izquierda
  speed: number; // px/segundo, crece con el nivel
  vehicles?: { x: number; width: number; type: 'car' | 'truck' | 'bike' }[];
  floaters?: {
    x: number;
    width: number;
    type: 'log' | 'turtle';
    submerged?: boolean;
  }[];
}
```

---

## Implementation plan

1. **Crear `components/games/FroggerGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 520 × 520 centrado.
   - Inicializa el grid, las 5 filas de carretera y las 5 filas de río con sus vehículos
     y flotadores, cada carril con dirección alterna y velocidad propia (aumentando hacia
     el centro para variar la dificultad, igual que el Frogger original).
   - Game loop con `requestAnimationFrame`: en cada frame actualiza posición de vehículos
     y flotadores según su `speed` y `direction` (con wrap-around en los bordes del canvas
     para que el tráfico sea continuo), actualiza el ciclo de inmersión de las tortugas,
     descuenta el temporizador de vida, y aplica el arrastre de corriente a la rana si
     está sobre un tronco/tortuga.
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no
     ejecuta ninguna actualización (vehículos, corriente, temporizador, colisiones).
   - Captura `keydown` (flechas y WASD): dispara un salto de una celda en la dirección
     correspondiente si no hay un salto en curso (`HOP_ANIMATION_MS` de cooldown) y el
     destino está dentro de los límites del grid.
   - Tras cada salto, evalúa colisión: vehículo en carril de carretera → pierde vida;
     carril de río sin tronco/tortuga válidos bajo la rana → pierde vida; casilla de meta
     vacía → suma puntos y marca la meta como ocupada; casilla de meta ya ocupada o seto
     → salto inválido, la rana no se mueve.
   - Cuando las 5 metas quedan ocupadas: suma el bono de nivel, incrementa `level`,
     incrementa velocidad de todos los carriles ~15%, limpia las metas, reposiciona la
     rana en la fila de salida y reinicia el temporizador.
   - Al perder una vida: si quedan vidas, reposiciona la rana en la fila de salida y
     reinicia el temporizador (conserva `score`/`level`); si no quedan vidas, llama
     `onLivesChange(0)` y luego `onGameOver(score)`.
   - Llama `onScoreChange` y `onLevelChange` cada vez que esos valores cambian dentro
     del loop (comparando con el valor anterior antes de disparar el callback).
   - Dibuja el HUD interno (score, vidas, nivel, barra de temporizador) sobre el canvas,
     sin ningún overlay HTML de "GAME OVER" — el modal React de la plataforma es el único
     indicador de fin de partida.
   - Limpia el listener de `keydown` y cancela el `requestAnimationFrame` en el `return`
     del `useEffect`.
     Verificación: el juego arranca en `/games/frogger/play` y es jugable con flechas y
     WASD; cruzar la carretera y el río sin colisionar permite ocupar una meta; llenar
     las 5 metas sube de nivel; agotar las 3 vidas dispara game over.

2. **Crear `app/games/frogger/play/page.tsx`** — play-page específica:
   - Importa `FroggerGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `3`), `level` (inicial `1`), `paused`, `over`,
     `name`, `saved`, `gameKey`.
   - Pasa `paused` y los cuatro callbacks (`onScoreChange`, `onLivesChange`,
     `onLevelChange`, `onGameOver`) a `FroggerGame`.
   - Reutiliza el mismo layout visual (HUD React con score/vidas/nivel, CRT, botón
     PAUSA/REANUDAR, modal de game over) que `app/games/asteroids/play/page.tsx` y
     `app/games/arkanoid/play/page.tsx`.
     Verificación: el HUD React refleja score, vidas y nivel en tiempo real; el botón
     "PAUSA" congela vehículos, corriente y temporizador; "REANUDAR" lo reanuda.

3. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [x] `/games/frogger/play` carga sin errores de SSR ni de TypeScript.
- [x] El canvas principal (520 × 520) se renderiza centrado con grid de 13 × 13 celdas.
- [x] La rana salta una celda por pulsación de flechas/WASD, con cooldown de animación
      que evita saltos dobles instantáneos.
- [x] La rana no puede salir de los límites horizontales ni retroceder más allá de la
      fila de salida.
- [x] Los 5 carriles de carretera mueven vehículos con direcciones y velocidades
      alternadas; solapar con un vehículo resta una vida.
- [x] Los 5 carriles de río mueven troncos y tortugas; caer en el agua sin estar sobre
      un flotador válido (o sobre una tortuga sumergida) resta una vida.
- [x] Estar sobre un tronco o tortuga arrastra a la rana con la corriente del carril;
      ser empujado fuera del tablero resta una vida.
- [x] Ocupar una casilla de meta vacía suma puntos y la marca como ocupada; una meta ya
      ocupada o un seto no permite el salto.
- [x] Llenar las 5 metas incrementa el nivel, aumenta la velocidad de los carriles ~15%
      y reinicia el tablero (metas vacías, rana en la fila de salida).
- [x] El temporizador de vida (25s) se muestra como barra en el HUD interno del canvas
      y, al llegar a 0, resta una vida.
- [x] Perder una vida con vidas restantes reposiciona la rana sin perder score ni nivel.
- [x] Al llegar a 0 vidas, se dispara `onGameOver(score)` y aparece el modal React de
      la plataforma con la puntuación final.
- [x] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [x] El botón "PAUSA" congela vehículos, corriente y temporizador; "REANUDAR" lo reanuda.
- [x] El canvas no dibuja ningún overlay "GAME OVER" propio.
- [x] `npm run build` completa sin errores de TypeScript.
- [x] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Clon fiel de Frogger, mismo nombre** — se conserva la mecánica central
  (cruce de carretera y río salto a salto, temporizador, 5 metas) sin inventar un
  concepto distinto. Razón: el usuario nombró explícitamente el juego clásico; solo se
  ajusta el nombre por convención de marca de la plataforma.

- **Sí: Grid discreto con salto por pulsación, no movimiento continuo** — a diferencia
  de Snake (tick continuo), la rana solo se mueve ante un `keydown` válido. Razón: es la
  mecánica exacta y reconocible del Frogger original; un movimiento continuo rompería
  la identidad del juego.

- **Sí: Temporizador por vida con barra en HUD interno** — el Frogger original tiene un
  límite de tiempo por intento. Razón: sin él, cruzar sin prisa elimina el riesgo
  principal del juego y lo desvirtúa.

- **Sí: Arrastre de corriente sobre troncos/tortugas** — replica la mecánica original
  donde el jugador debe compensar el movimiento del carril. Razón: es una de las fuentes
  de dificultad más reconocibles de Frogger; omitirla lo simplificaría demasiado.

- **Sí: Vidas y niveles como en Asteroids/Arkanoid** — 3 vidas iniciales, nivel que sube
  al completar el objetivo (5 metas), con velocidad creciente. Razón: coherencia con el
  contrato de props ya validado en otros juegos de la plataforma (`onLivesChange`,
  `onLevelChange`).

- **Sí: Doble HUD (canvas + React)** — el canvas dibuja su propio HUD (incluyendo el
  temporizador, que no forma parte del contrato de props hacia React) y React muestra
  score/vidas/nivel en el HUD de la plataforma. Razón: consistencia con Tetris/Arkanoid;
  el temporizador es un detalle interno de la mecánica que no necesita salir del canvas.

- **Sí: Callbacks como interfaz de comunicación** — mismo contrato que
  `ArkanoidGameProps`/`AsteroidsGameProps`. Razón: desacoplamiento limpio; el componente
  canvas no sabe nada de React ni de Supabase.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente.
  Razón: `canvas` y `requestAnimationFrame` no existen en SSR.

- **Sí: Play-page específica `app/games/frogger/play/page.tsx`** — en lugar de modificar
  la ruta genérica `[id]/play`. Razón: coherencia con el resto de juegos; Next.js App
  Router prioriza rutas estáticas sobre dinámicas.

- **No: Bonus especiales del Frogger original (mosca, lady frog, alligator lanes)** —
  se descartan del MVP. Razón: no son parte del core mínimo jugable; se evalúan en una
  iteración futura si se desea profundidad extra.

- **No: Menú de pausa interno del canvas** — la plataforma controla la pausa vía prop.
  Razón: consistencia con Tetris/Arkanoid.

- **No: Componente genérico `CanvasGame`** — se sigue posponiendo. Razón: YAGNI, ya
  descartado en los specs 07–09; con cinco juegos aún no hay presión suficiente para
  abstraer bien sin sobre-diseñar.

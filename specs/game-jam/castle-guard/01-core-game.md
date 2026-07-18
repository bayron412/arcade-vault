# SPEC GAME-JAM — Core Game: CASTLE GUARD

> **Estado:** Propuesto
> **Depende de:** —
> **Fecha:** 2026-07-18
> **Objetivo:** Diseñar la mecánica completa de CASTLE GUARD, un tower defense de oleadas
> (coloca torretas junto a un camino fijo para detener enemigos antes de que lleguen al
> castillo) implementado en canvas 2D puro, como nuevo juego jugable de Arcade Vault.

---

## Scope

**In:**

- Mecánica clásica de tower defense: un camino serpenteante fijo cruza un grid; oleadas de
  enemigos avanzan por ese camino desde el punto de aparición hasta el castillo al otro
  extremo; el jugador construye torretas en las celdas libres junto al camino para
  eliminarlos antes de que lleguen.
- Grid discreto de 15 columnas × 10 filas, celdas de 48px → canvas de 720 × 480px.
- Camino fijo de un único carril (sin bifurcaciones), definido como una secuencia de
  waypoints en el grid que entra por el borde izquierdo (fila 4), serpentea en forma de
  "S" hacia abajo, al centro y hacia arriba, y sale por el borde derecho (fila 1) donde
  está el castillo. Las celdas del camino no son construibles; el resto del grid sí.
- 3 tipos de torreta, seleccionables con las teclas `1`/`2`/`3` y colocadas con clic sobre
  una celda libre válida (no ocupada, fuera del camino):
  - **Torreta** (barata, disparo rápido, un solo objetivo).
  - **Cañón** (cara, disparo lento, daño en área/splash).
  - **Torre de escarcha** (daño bajo, aplica ralentización temporal al enemigo impactado).
  - Cada torreta ataca automáticamente al enemigo más cercano dentro de su rango, sin
    intervención adicional del jugador tras colocarla.
- 3 tipos de enemigo con estadísticas propias (vida, velocidad, recompensa de oro, vidas
  del castillo que restan si llegan al final): **esbirro** (equilibrado), **explorador**
  (rápido, poca vida) y **bestia** (lenta, mucha vida, aparece desde la oleada 3).
- Economía: el jugador arranca con oro inicial; matar enemigos otorga oro; construir una
  torreta cuesta oro y falla silenciosamente (con feedback visual) si no alcanza.
- Sistema de oleadas: cada oleada define una composición y cantidad de enemigos que
  aumenta con el número de oleada; tras eliminar/perder a todos los enemigos de la oleada
  actual hay una cuenta regresiva antes de que arranque la siguiente (o el jugador puede
  saltarla).
- Vidas del castillo: el jugador arranca con vidas fijas; un enemigo que alcanza el final
  del camino resta vidas (más de una si es una bestia) y desaparece. Al llegar a 0 vidas,
  se dispara `onGameOver(score)`.
- Sistema de puntuación: puntos por cada enemigo eliminado (proporcional a su recompensa
  de oro) y bono al completar una oleada sin más enemigos vivos.
- HUD interno del canvas: oro, vidas del castillo, número de oleada actual, cuenta
  regresiva para la próxima oleada y tipo de torreta seleccionada, dibujados con
  primitivas de canvas (patrón de doble HUD, igual que Tetris/Arkanoid/Frogger).
- Componente `components/games/CastleGuardGame.tsx` y play-page
  `app/games/castle-guard/play/page.tsx`.

**Fuera de alcance:**

- Vender o mejorar torretas ya colocadas — solo construcción en este MVP.
- Múltiples caminos o bifurcaciones — un único carril fijo.
- Habilidades especiales del jugador (bombas, hechizos) más allá de las 3 torretas base.
- Selector de torreta mediante menú HTML superpuesto al canvas — la selección se hace con
  teclas numéricas, no con overlays de React sobre el lienzo.
- Controles táctiles o mobile.
- Selector de skins o temas visuales alternativos.
- Menú de pausa interno del canvas — la pausa la controla exclusivamente la plataforma
  vía prop `paused`.
- Extracción de un componente genérico `CanvasGame` reutilizable.
- Supabase Auth y RLS — `user_id` se almacena como `null` (cubierto en spec 02).
- Realtime en el leaderboard (cubierto en spec 02).

---

## Data model

### Props del componente `CastleGuardGame`

```ts
interface CastleGuardGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void; // level = número de oleada actual
  onGameOver: (finalScore: number) => void;
}
```

No se introducen tablas ni tipos TypeScript nuevos — se reutilizan `GameRow` y `ScoreRow`
de `lib/supabase/types.ts` (ver spec 02 para el INSERT concreto).

### Constantes internas del componente

Dentro de `CastleGuardGame.tsx`, sin persistencia externa:

```ts
const GRID_COLS = 15;
const GRID_ROWS = 10;
const CELL = 48; // px

// Waypoints en coordenadas de grid; -1 y GRID_COLS marcan spawn/castillo fuera del canvas.
const PATH_WAYPOINTS: { col: number; row: number }[] = [
  { col: -1, row: 4 },
  { col: 4, row: 4 },
  { col: 4, row: 8 },
  { col: 9, row: 8 },
  { col: 9, row: 1 },
  { col: 15, row: 1 },
];

const STARTING_GOLD = 150;
const STARTING_LIVES = 20;
const WAVE_BUFFER_SECONDS = 4;

type TowerType = 'turret' | 'cannon' | 'frost';

interface TowerSpec {
  cost: number;
  damage: number;
  range: number; // px
  fireRate: number; // disparos/seg
  splashRadius?: number; // px, solo cannon
  slowFactor?: number; // 0-1, solo frost
  slowDurationMs?: number; // solo frost
}

const TOWER_SPECS: Record<TowerType, TowerSpec> = {
  turret: { cost: 40, damage: 8, range: 110, fireRate: 2 },
  cannon: { cost: 90, damage: 25, range: 90, fireRate: 0.7, splashRadius: 40 },
  frost: {
    cost: 70,
    damage: 4,
    range: 100,
    fireRate: 1,
    slowFactor: 0.4,
    slowDurationMs: 2000,
  },
};

type EnemyType = 'grunt' | 'scout' | 'brute';

interface EnemySpec {
  baseHp: number;
  hpPerWave: number;
  speed: number; // px/seg
  reward: number; // oro al morir
  livesLost: number; // vidas de castillo si llega al final
  minWave: number; // primera oleada en que puede aparecer
}

const ENEMY_SPECS: Record<EnemyType, EnemySpec> = {
  grunt: {
    baseHp: 30,
    hpPerWave: 6,
    speed: 60,
    reward: 5,
    livesLost: 1,
    minWave: 1,
  },
  scout: {
    baseHp: 18,
    hpPerWave: 4,
    speed: 110,
    reward: 4,
    livesLost: 1,
    minWave: 1,
  },
  brute: {
    baseHp: 90,
    hpPerWave: 15,
    speed: 35,
    reward: 12,
    livesLost: 2,
    minWave: 3,
  },
};
```

Entidades en memoria del componente (no persistentes):

```ts
interface Tower {
  col: number;
  row: number;
  type: TowerType;
  cooldownMs: number; // tiempo restante hasta el próximo disparo
}

interface Enemy {
  id: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  waypointIndex: number; // próximo waypoint objetivo
  x: number;
  y: number; // posición en px sobre el canvas
  slowedUntilMs: number; // 0 si no está ralentizado
}

interface Projectile {
  x: number;
  y: number;
  targetEnemyId: number;
  damage: number;
  speed: number; // px/seg, 0 = impacto instantáneo (hitscan)
  splashRadius?: number;
}
```

---

## Implementation plan

1. **Crear `components/games/CastleGuardGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 720 × 480 centrado, con el grid, el camino y el castillo
     precalculados a partir de `PATH_WAYPOINTS` al montar.
   - Mantiene estado interno (refs, no React state) de `gold`, `lives`, `wave`, `towers`,
     `enemies`, `projectiles`, `selectedTowerType`, `waveTimerMs` y `spawnQueue`.
   - Game loop con `requestAnimationFrame`: si `paused` es `true`, solo llama a `draw()`
     sin avanzar ninguna simulación (enemigos, torretas, proyectiles, temporizadores).
   - En cada frame (no pausado): hace avanzar a cada enemigo hacia su próximo waypoint a
     su `speed` (reducida por `slowFactor` si `slowedUntilMs` no ha expirado), actualizando
     `waypointIndex` al llegar; descuenta `cooldownMs` de cada torreta y, si llega a 0,
     busca el enemigo vivo más cercano dentro de su `range` y dispara (crea un
     `Projectile` para `cannon`, aplica daño instantáneo para `turret`/`frost`); avanza los
     `projectiles` con `speed > 0` hacia su objetivo y aplica daño (con splash de área para
     `cannon`) al impactar.
   - Un enemigo cuya `hp` llega a 0 se elimina, suma `ENEMY_SPECS[type].reward` a `gold` y
     puntos (`reward * 2`) a `score`. Un enemigo que alcanza el último waypoint (el
     castillo) se elimina, resta `ENEMY_SPECS[type].livesLost` a `lives` y no otorga oro
     ni puntos.
   - Captura `keydown` de `1`/`2`/`3` para cambiar `selectedTowerType` a `turret`/
     `cannon`/`frost` respectivamente.
   - Captura `click` sobre el canvas: traduce las coordenadas del clic a celda de grid
     (`col`, `row`) vía el `bounding rect` del canvas y `CELL`; si la celda está fuera del
     camino, no tiene ya una torreta y `gold >= TOWER_SPECS[selectedTowerType].cost`,
     coloca la torreta, descuenta el costo de `gold` y agrega un breve destello verde en
     esa celda; si la celda es inválida o no alcanza el oro, dibuja un destello rojo breve
     sin colocar nada (feedback sin bloquear la interacción).
   - Cuando no quedan enemigos vivos ni pendientes de spawnear en la oleada actual: suma
     un bono de oleada a `score` y `gold` (`wave * 20`), inicia la cuenta regresiva
     `WAVE_BUFFER_SECONDS`; al expirar (o si el jugador presiona `SPACE` para saltarla),
     incrementa `wave`, genera la composición de la próxima oleada (más enemigos y mezcla
     con proporción creciente de `scout`/`brute` a medida que `wave` aumenta, `brute` solo
     desde `wave >= brute.minWave`) y comienza a spawnearlos con un intervalo fijo entre
     apariciones.
   - Llama `onScoreChange`, `onLivesChange` y `onLevelChange` (con `wave`) cada vez que
     esos valores cambian dentro del loop (comparando con el valor anterior antes de
     disparar el callback).
   - Cuando `lives <= 0`: llama `onLivesChange(0)` y luego `onGameOver(score)`, deteniendo
     la simulación (el `requestAnimationFrame` deja de programarse a sí mismo).
   - Dibuja el HUD interno (oro, vidas, oleada, cuenta regresiva, torreta seleccionada)
     sobre el canvas, sin ningún overlay HTML de "GAME OVER" — el modal React de la
     plataforma es el único indicador de fin de partida.
   - Limpia los listeners de `keydown`/`click` y cancela el `requestAnimationFrame` en el
     `return` del `useEffect`.
     Verificación: el juego arranca en `/games/castle-guard/play` y es jugable con teclas
     `1`/`2`/`3` + clic; construir torretas junto al camino elimina enemigos antes de que
     lleguen al castillo; agotar las vidas del castillo dispara game over.

2. **Crear `app/games/castle-guard/play/page.tsx`** — play-page específica:
   - Importa `CastleGuardGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `STARTING_LIVES`), `level` (inicial `1`),
     `paused`, `over`, `name`, `saved`, `gameKey`.
   - Pasa `paused` y los cuatro callbacks (`onScoreChange`, `onLivesChange`,
     `onLevelChange`, `onGameOver`) a `CastleGuardGame`.
   - Reutiliza el mismo layout visual (HUD React con score/vidas/nivel, CRT, botón
     PAUSA/REANUDAR, modal de game over) que `app/games/asteroids/play/page.tsx` y
     `app/games/frogger/play/page.tsx`; `level` se etiqueta como "OLEADA" en el HUD React
     en lugar de "NIVEL".
     Verificación: el HUD React refleja score, vidas y oleada en tiempo real; el botón
     "PAUSA" congela enemigos, torretas, proyectiles y la cuenta regresiva de oleada;
     "REANUDAR" lo reanuda.

3. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] `/games/castle-guard/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas principal (720 × 480) se renderiza centrado con grid de 15 × 10 celdas y
      el camino fijo dibujado de forma clara desde el spawn hasta el castillo.
- [ ] Las teclas `1`/`2`/`3` cambian la torreta seleccionada (torreta/cañón/escarcha),
      reflejado en el HUD interno del canvas.
- [ ] Un clic sobre una celda libre fuera del camino, con oro suficiente, coloca la
      torreta seleccionada y descuenta su costo de oro.
- [ ] Un clic sobre el camino, sobre una celda ya ocupada, o sin oro suficiente no coloca
      ninguna torreta y muestra feedback visual de intento inválido.
- [ ] Cada torreta ataca automáticamente al enemigo más cercano dentro de su rango sin
      intervención adicional del jugador.
- [ ] El cañón aplica daño en área a todos los enemigos dentro de su radio de splash al
      impactar.
- [ ] La torre de escarcha ralentiza temporalmente al enemigo impactado.
- [ ] Los 3 tipos de enemigo (esbirro, explorador, bestia) tienen velocidad y vida
      distinguibles; la bestia solo aparece desde la oleada 3 en adelante.
- [ ] Eliminar un enemigo suma oro y puntos proporcionales a su recompensa.
- [ ] Un enemigo que alcanza el castillo resta las vidas correspondientes a su tipo y
      desaparece sin otorgar oro ni puntos.
- [ ] Al vaciarse la oleada actual, se suma un bono de oro/puntos y arranca una cuenta
      regresiva antes de la siguiente oleada, mostrada en el HUD interno.
- [ ] Presionar `SPACE` durante la cuenta regresiva adelanta el inicio de la próxima
      oleada.
- [ ] Cada oleada sucesiva aumenta la cantidad de enemigos y desplaza la mezcla hacia
      tipos más difíciles.
- [ ] Al llegar a 0 vidas del castillo, se dispara `onGameOver(score)` y aparece el modal
      React de la plataforma con la puntuación final.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y oleada
      ("OLEADA" en lugar de "NIVEL").
- [ ] El botón "PAUSA" congela enemigos, torretas, proyectiles y la cuenta regresiva de
      oleada; "REANUDAR" lo reanuda.
- [ ] El canvas no dibuja ningún overlay "GAME OVER" propio.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Un único carril fijo sin bifurcaciones** — simplifica el pathfinding a una lista
  ordenada de waypoints que los enemigos recorren en secuencia. Razón: es la variante de
  tower defense más simple de implementar en canvas 2D puro sin motor de físicas ni grafos
  de rutas, sin sacrificar la identidad reconocible del género (estilo torres arcade
  clásicas).

- **Sí: 3 tipos de torreta con roles claramente distintos** — torreta (DPS base),
  cañón (área), escarcha (control). Razón: da profundidad táctica mínima viable sin
  requerir un sistema de mejoras; cada torreta resuelve un problema distinto (objetivo
  único rápido vs. grupos vs. enemigos rápidos).

- **Sí: Selección de torreta por teclado (`1`/`2`/`3`), colocación por clic** — evita
  introducir un menú HTML superpuesto al canvas. Razón: mantiene el contrato de que el
  componente canvas no sabe nada de React; un menú de selección con overlays de DOM
  rompería la separación ya validada en el resto de juegos de la plataforma.

- **Sí: Vidas del castillo en lugar de "game over al primer enemigo"** — cada enemigo que
  llega al final resta 1 o 2 vidas según su tipo, en vez de terminar la partida de
  inmediato. Razón: coherencia con el contrato `onLivesChange` ya validado en
  Asteroids/Arkanoid/Frogger, y da margen de error razonable propio del género tower
  defense (perder algunos enemigos no debería ser instantáneamente fatal).

- **Sí: `level` representa el número de oleada** — reutiliza el campo `onLevelChange` ya
  existente en el contrato de props en lugar de inventar un callback nuevo. Razón:
  consistencia con el patrón de Frogger (`level` = progresión dentro del mismo juego);
  el HUD React solo necesita re-etiquetar "NIVEL" como "OLEADA".

- **Sí: Cuenta regresiva entre oleadas, saltable con `SPACE`** — da tiempo al jugador para
  reorganizar su defensa sin forzarlo a esperar si ya está listo. Razón: patrón estándar
  del género (Bloons TD, Kingdom Rush) que evita tanto la frustración de no tener margen
  como el tedio de una espera obligatoria larga.

- **Sí: Categoría `ARCADE` en el INSERT (spec 02), no una categoría nueva** — aunque el
  concepto es de género "tower defense/estrategia", se mantiene dentro del enum
  `GameRow['cat']` ya existente (`ARCADE`/`PUZZLE`/`SHOOTER`). Razón: mismo precedente que
  FROGGER (sugerido como MAZE pero implementado como ARCADE); extender el tipo y el
  arreglo `CATEGORIES` de `app/games/GamesGrid.tsx` es un cambio transversal que excede el
  alcance de un único juego nuevo.

- **No: Vender o mejorar torretas** — se descarta del MVP. Razón: no es parte del núcleo
  mínimo jugable; añade una capa de UI (selección de torreta existente, confirmación de
  venta/mejora) que se puede evaluar en una iteración futura.

- **No: Múltiples caminos o bifurcaciones** — un único carril fijo. Razón: mantiene el
  pathfinding trivial (lista de waypoints) sin necesitar un grafo de rutas ni lógica de
  elección de camino por parte de los enemigos.

- **No: Menú de pausa interno del canvas** — la plataforma controla la pausa vía prop.
  Razón: consistencia con Tetris/Arkanoid/Frogger.

- **No: Componente genérico `CanvasGame`** — se sigue posponiendo. Razón: YAGNI, ya
  descartado en specs anteriores; con seis juegos aún no hay presión suficiente para
  abstraer bien sin sobre-diseñar.

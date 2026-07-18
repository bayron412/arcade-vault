# SPEC 12 — Optimización de performance en el render loop de los 5 juegos

> **Estado:** Implementado
> **Depende de:** 07-tetris-game, 08-arkanoid-game, 09-snake-game, 05-asteroids-integracion (Frogger, `specs/game-jam/frogger/`)
> **Fecha:** 2026-07-18
> **Objetivo:** Reducir el costo de CPU/GPU del render loop de Frogger, Asteroids,
> Tetris, Arkanoid y Snake cacheando los fondos estáticos en canvas offscreen,
> eliminando `save()/restore()` por-objeto en loops y evitando allocaciones
> innecesarias por frame, sin alterar ningún resultado visual ni comportamiento
> de juego.

---

## Scope

**In:**

- Cachear en un `<canvas>` offscreen (`useRef`, sin `useState`) toda la parte
  100% estática del fondo de cada juego, y blitear ese offscreen (`drawImage`)
  cada frame en vez de recalcular `fillRect`/líneas/patrones:
  - **Frogger** (`components/games/FroggerGame.tsx`): filas de grass/road/water
    coloreadas + patrón diagonal del hedge. Las 5 casas (`HOME_COLUMNS`) se
    siguen dibujando en vivo cada frame sobre el offscreen, ya que su estado
    (`homesOccupied`) cambia durante la partida.
  - **Snake** (`components/games/SnakeGame.tsx`): fondo del tablero (grid 20×20).
  - **Tetris** (`components/games/TetrisGame.tsx`): líneas de grid del tablero
    de juego y del panel "next piece" (`drawGrid`).
  - **Arkanoid** (`components/games/ArkanoidGame.tsx`): fondo base del canvas
    (el `fillRect(0,0,W,H)` de `draw()`); los bloques (`blocks`) NO se cachean
    porque cambian de estado (destruidos) durante la partida.
  - **Asteroids** (`components/games/AsteroidsGame.tsx`): fondo base del canvas
    (el `fillRect(0,0,W,H)` de `draw()`).
- Eliminar `ctx.save()`/`ctx.restore()` dentro de loops por-objeto,
  reemplazándolos por lectura/escritura directa de las propiedades de `ctx`
  que cambian (`fillStyle`, etc.) sin push/pop de estado completo por
  iteración:
  - Frogger: loop de vehículos en `drawLanes()`.
  - Asteroids: `Asteroid.draw()`, `PowerUp.draw()`, `drawLifeIcon` (llamado
    por vida en loop).
- Evitar allocaciones nuevas por frame cuando no hay elementos que remover:
  - Asteroids: los `.filter()` sobre `bullets`/`particles`/`powerUps`/
    `asteroids` en `update()` solo se ejecutan si realmente hay elementos
    marcados para eliminar (en vez de crear un array nuevo cada frame
    incondicionalmente).
  - Arkanoid: el `.filter()` sobre `explosions` en `update()` con el mismo
    criterio.
- Mantener el resultado visual pixel-a-pixel idéntico al actual en los 5
  juegos (mismos colores, glow, animaciones, timing).
- Invalidar y regenerar el offscreen cache correspondiente cuando cambia el
  `skin` seleccionado (ya que los colores del fondo dependen del skin).
- Verificación de FPS (≥ 55–60 FPS sostenidos, medidos ~30s de juego normal
  con el Rendering/Performance tab de Chrome DevTools) en los 5 juegos, antes
  y después del cambio, en `localhost:3000`.

**Fuera de alcance:**

- Cambiar o reducir `shadowBlur`/`shadowColor` (glow) en Frogger (vehículos,
  rana) o Snake (cabeza) — se mantienen exactamente igual, sin optimizar ese
  costo, según decisión explícita del usuario.
- Reducir cantidad de partículas, tamaño de explosiones, o cualquier otro
  ajuste que altere el resultado visual — cero cambios visuales perceptibles
  es un requisito duro de este spec.
- Introducir nuevo estado de React (`useState`) para gestionar el cache o
  cualquier dato del render loop — todo vive en `useRef`, para no generar
  re-renders adicionales del componente.
- Tocar `MobileGamepad.tsx`, mapeos de teclas, lógica de colisiones/reglas de
  juego, o cualquier archivo fuera de los 5 componentes de juego listados.
- Migrar a WebGL, `OffscreenCanvas` (Web Worker) o cualquier tecnología de
  render distinta a Canvas 2D — se mantiene 2D Canvas API.
- Optimizaciones de bundle size, carga inicial o Lighthouse score — este spec
  es exclusivamente sobre performance del render loop en tiempo de juego.

---

## Data model

No se introduce ningún dato de dominio nuevo (sin cambios en Supabase, tipos
de score, o props públicas de los componentes). Cada uno de los 5 componentes
de juego gana una referencia interna nueva, análoga a las que ya existen
(`pausedRef`, `skinRef`, `callbacksRef` en Frogger):

```ts
// Dentro de cada componente de juego (FroggerGame, AsteroidsGame,
// TetrisGame, ArkanoidGame, SnakeGame), junto a los demás useRef del efecto:
const bgCacheRef = useRef<HTMLCanvasElement | null>(null);
const bgCacheSkinRef = useRef<SkinId | null>(null); // solo en juegos con skins (Frogger, Snake, Tetris...)
```

- `bgCacheRef`: canvas offscreen (creado con `document.createElement('canvas')`,
  nunca añadido al DOM) del mismo tamaño que el canvas visible, donde se
  pre-renderiza una sola vez la parte estática del fondo.
- `bgCacheSkinRef` (solo en juegos con selector de skin): guarda qué skin
  fue usado para generar el cache actual; si `skin` cambia, se detecta la
  diferencia y se regenera `bgCacheRef` antes del siguiente `draw()`.
- Ninguna de estas referencias dispara re-render (no son `useState`), acorde
  a la restricción del usuario de minimizar estado de React en estos
  componentes.

---

## Implementation plan

1. **Frogger — offscreen cache del fondo estático + quitar save/restore en
   `drawLanes()`** (`components/games/FroggerGame.tsx`):
   - Crear `bgCacheRef`/`bgCacheSkinRef`. En `initGame()` (o antes del primer
     `draw()`), generar el offscreen dibujando una sola vez las filas de
     grass/road/water y el patrón diagonal del hedge (todo lo que hoy hace
     `drawBackground()` salvo el loop de `HOME_COLUMNS`).
   - `drawBackground()` pasa a: `ctx.drawImage(bgCacheRef.current, 0, 0)` +
     el loop de las 5 casas (que sí sigue siendo dinámico) encima.
   - Si `skin` cambia, regenerar el offscreen antes del siguiente frame.
   - En `drawLanes()`, quitar el `ctx.save()`/`ctx.restore()` del loop de
     vehículos; asignar `fillStyle`/`shadowColor`/`shadowBlur` directamente
     por iteración (el shadowBlur se mantiene, solo cambia cómo se aplica el
     estado del contexto).
   - Verificación: Frogger se ve pixel-a-pixel igual (grass/road/water/hedge/
     casas/vehículos/glow), las casas se siguen iluminando al ocuparlas, y
     cambiar de skin actualiza el fondo correctamente.

2. **Asteroids — offscreen cache del fondo + quitar save/restore por-objeto +
   evitar filter() incondicional** (`components/games/AsteroidsGame.tsx`):
   - Cachear el `fillRect(0,0,W,H)` de fondo en un offscreen (se regenera solo
     si cambia el tamaño del canvas, no hay skin dinámico aquí salvo que se
     confirme lo contrario al leer el archivo).
   - Quitar `ctx.save()/restore()` de `Asteroid.draw()`, `PowerUp.draw()` y
     `drawLifeIcon` (llamado en loop de vidas); aplicar el estilo necesario
     directamente sin push/pop de contexto completo.
   - En `update()`, los `.filter()` sobre `bullets`/`particles`/`powerUps`/
     `asteroids` solo se ejecutan cuando hay al menos un elemento marcado
     para remover en ese frame (flag o chequeo previo con `.some()` antes de
     `.filter()`, o mutación in-place con splice hacia atrás).
   - Verificación: Asteroids se ve y juega igual (colisiones, explosiones,
     power-ups, vidas), sin asteroides/balas "fantasma" ni errores de índice.

3. **Tetris — offscreen cache de `drawGrid()` (tablero + "next piece")**
   (`components/games/TetrisGame.tsx`):
   - Cachear las líneas de grid del tablero principal y del panel "next" en
     dos offscreens (o uno combinado), generados una vez al montar.
   - `draw()`/`drawNext()` blitean el offscreen correspondiente en vez de
     recorrer `COLS`/`ROWS` cada frame para trazar líneas.
   - Verificación: el grid se ve idéntico, las piezas activas/fijas siguen
     dibujándose correctamente encima.

4. **Arkanoid — offscreen cache del fondo base**
   (`components/games/ArkanoidGame.tsx`):
   - Cachear el `fillRect(0,0,W,H)` de fondo de `draw()` en un offscreen
     (los bloques, paddle, ball y explosions se siguen dibujando en vivo).
   - Cambiar el `.filter()` incondicional de `explosions` por la misma
     estrategia que Asteroids (solo filtrar si hay explosiones para remover).
   - Verificación: Arkanoid se ve y juega igual (bloques, rebotes,
     explosiones al romper bloques).

5. **Snake — offscreen cache del fondo del tablero**
   (`components/games/SnakeGame.tsx`):
   - Cachear el `fillRect(0,0,W,H)` del tablero 20×20 en un offscreen
     (cuerpo/cabeza/comida se siguen dibujando en vivo cada frame). Si el
     fondo depende de `skin`, aplicar la misma invalidación por cambio de
     skin que en Frogger.
   - Verificación: Snake se ve y juega igual (glow de la cabeza intacto,
     crecimiento del cuerpo, comida).

6. **Verificación final de performance en los 5 juegos**:
   - Con `npm run dev` en `localhost:3000`, medir FPS con el Rendering/
     Performance tab de Chrome DevTools durante ~30s de juego normal en cada
     uno de los 5 juegos, confirmando ≥ 55–60 FPS sostenidos.
   - Comparación visual manual (antes/después) de cada juego en sus distintos
     skins disponibles, confirmando cero diferencias perceptibles.
   - `npm run build` completa sin errores de TypeScript.

---

## Acceptance criteria

- [ ] Frogger cachea el fondo estático (grass/road/water/hedge) en un canvas
      offscreen vía `useRef`; las 5 casas se siguen dibujando en vivo cada
      frame y reflejan `homesOccupied` correctamente.
- [ ] Cambiar de skin en Frogger regenera el offscreen y el fondo se ve con
      los colores del nuevo skin, sin artefactos del skin anterior.
- [ ] El loop de vehículos en `drawLanes()` (Frogger) ya no usa
      `ctx.save()/ctx.restore()` por vehículo.
- [ ] Asteroids cachea el fondo base en offscreen; el juego (colisiones,
      explosiones, power-ups, vidas) se comporta exactamente igual que antes.
- [ ] `Asteroid.draw()`, `PowerUp.draw()` y `drawLifeIcon` en Asteroids ya no
      usan `ctx.save()/ctx.restore()` dentro de sus loops.
- [ ] En Asteroids y Arkanoid, los `.filter()` sobre arrays de partículas/
      balas/power-ups/explosiones solo se ejecutan cuando hay elementos que
      remover en ese frame (no incondicionalmente cada frame).
- [ ] Tetris cachea las líneas de grid del tablero y del panel "next piece"
      en offscreen; las piezas activas y fijas se siguen viendo correctamente
      encima del grid.
- [ ] Arkanoid cachea el fondo base en offscreen; bloques, paddle, ball y
      explosiones se comportan exactamente igual que antes.
- [ ] Snake cachea el fondo del tablero en offscreen; cuerpo, cabeza (con su
      glow intacto) y comida se comportan exactamente igual que antes.
- [ ] Ninguno de los 5 componentes introduce nuevo `useState` para el cache
      o datos del render loop — todo vive en `useRef`.
- [ ] Cero diferencias visuales perceptibles en ninguno de los 5 juegos,
      en ninguno de sus skins disponibles, comparado con el comportamiento
      antes de este spec (colores, glow, animaciones, timing de juego).
- [ ] Los 5 juegos sostienen ≥ 55–60 FPS durante ~30s de juego normal,
      medido con el Rendering/Performance tab de Chrome DevTools en
      `localhost:3000`.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ningún archivo fuera de los 5 componentes de juego
      (`FroggerGame.tsx`, `AsteroidsGame.tsx`, `TetrisGame.tsx`,
      `ArkanoidGame.tsx`, `SnakeGame.tsx`) fue modificado.

---

## Decisions

- **Sí: cachear fondos estáticos en canvas offscreen vía `useRef`** — el
  patrón dominante detectado en los 5 juegos es redibujar fondo/grid completo
  cada frame sin necesidad; pre-renderizarlo una vez y blitearlo con
  `drawImage` es la optimización de mayor impacto con menor riesgo visual.
  Se usa `useRef` (nunca `useState`) para no introducir re-renders de React,
  según pedido explícito del usuario.

- **No: optimizar `shadowBlur`/glow** — el usuario confirmó explícitamente
  dejar fuera de alcance el glow de Frogger (vehículos, rana) y Snake
  (cabeza), priorizando cero riesgo visual sobre esa ganancia de performance.

- **Sí: quitar `save()/restore()` de loops por-objeto en Frogger y
  Asteroids** — cada `save()/restore()` empuja/saca el estado completo del
  contexto 2D; en loops de decenas de objetos por frame esto es puro
  overhead evitable asignando solo las propiedades que cambian.

- **Sí: condicionar los `.filter()` de arrays en Asteroids/Arkanoid a que
  haya elementos que remover** — evita crear un array nuevo (con el mismo
  contenido) en cada frame cuando no hay nada que limpiar, que es el caso
  más común entre eventos de colisión.

- **Sí: invalidar el cache offscreen al cambiar de skin** — los fondos
  cacheados dependen de los colores del skin activo (Frogger, Snake); sin
  invalidación, cambiar de skin dejaría el fondo obsoleto.

- **No: tocar bloques de Arkanoid ni casas de Frogger en el cache** — ambos
  cambian de estado durante la partida (bloques destruidos, casas ocupadas),
  así que se siguen dibujando en vivo cada frame sobre el offscreen estático,
  evitando lógica de invalidación parcial más compleja y propensa a bugs.

- **No: migrar a WebGL/OffscreenCanvas en Worker** — fuera de alcance; el
  objetivo es eliminar el overhead evitable dentro de Canvas 2D, no cambiar
  de tecnología de render.

- **Un solo spec para los 5 juegos** — el usuario prefirió cubrir los 5
  juegos como pasos secuenciales de un mismo spec en vez de dividirlo,
  ya que el patrón de optimización (offscreen cache, quitar save/restore,
  filter condicional) es el mismo en todos y se implementa en una sola
  pasada con `/spec-impl`.

---

## Identified risks

- **Regresión visual sutil no detectada manualmente** — el offscreen cache
  podría desalinearse en 1px o quedar con un color ligeramente distinto si el
  cálculo del cache no reproduce exactamente el mismo código que hoy dibuja
  el fondo en vivo. Mitigación: el cache se construye copiando literalmente
  la lógica de dibujo actual, sin reescribirla "a mano" con valores nuevos.

- **Cache obsoleto tras resize de canvas (mobile)** — Frogger/Asteroids/
  Tetris/Arkanoid/Snake ya manejan escalado de canvas para mobile
  (`specs/10-mobile-touch-controls.md`); si el offscreen se crea una sola vez
  con el tamaño inicial y el canvas visible luego cambia de tamaño, el
  `drawImage` quedaría mal escalado o recortado. Mitigación: el offscreen se
  crea/regenera con las mismas dimensiones `W`/`H` fijas del canvas lógico
  (no del tamaño CSS en pantalla), que ya es constante en los 5 juegos
  actuales — se debe verificar esto explícitamente por juego durante la
  implementación.

- **Bug de índices al cambiar `.filter()` por mutación in-place (Asteroids,
  Arkanoid)** — recorrer un array hacia adelante mientras se remueven
  elementos (`splice`) puede saltarse el siguiente elemento si no se hace
  hacia atrás o con cuidado. Mitigación: usar el patrón estándar de recorrido
  en reversa (`for (let i = arr.length - 1; i >= 0; i--)`) al remover
  in-place, y verificar manualmente que no queden balas/partículas
  "fantasma" tras varias colisiones seguidas.

- **Umbral de FPS no reproducible entre máquinas** — 55–60 FPS puede variar
  según el hardware donde se mida. Mitigación: la verificación es un check
  cualitativo de "no cae por debajo del umbral en la máquina de desarrollo
  actual", no una garantía cross-device; no se bloquea el spec por
  diferencias de hardware ajenas al cambio de código.

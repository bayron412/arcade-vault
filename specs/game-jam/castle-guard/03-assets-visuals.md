# SPEC GAME-JAM — Assets & Visuals: CASTLE GUARD

> **Estado:** Propuesto
> **Depende de:** 01-core-game.md
> **Fecha:** 2026-07-18
> **Objetivo:** Definir la identidad visual de CASTLE GUARD — todo dibujado con
> primitivas de canvas, sin sprites ni audio externos — y el wiring del cover (nueva
> clase CSS) y del HUD React de la plataforma.

---

## Scope

**In:**

- Paleta de color y estética de todos los elementos del juego (grid, camino, castillo,
  torretas, enemigos, proyectiles) usando únicamente primitivas de Canvas 2D
  (`fillRect`, `arc`, `roundRect`, gradientes) y las variables CSS de la plataforma
  (`--cyan`, `--green`, `--magenta`, `--yellow`, `--ink`, etc.) traducidas a valores hex
  dentro del componente.
- Nueva clase de cover `.cover-torres` en `app/globals.css`, ya que ninguna clase
  existente sin usar (`cover-glot`, `cover-invaders`, `cover-duelo`) representa un
  concepto de fortaleza/torres — todas están asociadas visualmente a otros conceptos
  (Pac-Man, Space Invaders, duelo de lucha respectivamente).
- HUD React de la plataforma (patrón de doble HUD: canvas + React) mostrando score,
  vidas del castillo y oleada ("OLEADA" en vez de "NIVEL") en tiempo real.

**Fuera de alcance:**

- Sprites o spritesheets externos (PNG) — N/A, todo se dibuja con primitivas de canvas.
- Efectos de sonido o música — N/A, no se introduce audio en este MVP.
- Animaciones complejas (partículas, shaders) — se limita a transformaciones simples
  (destello de colocación de torreta, trayectoria de proyectiles, splash de área) para
  no comprometer el rendimiento del game loop con muchos enemigos/torretas simultáneos.

---

## Data model

N/A para assets externos — no hay sprites ni sonidos que copiar a `public/`. Los únicos
"datos visuales" son constantes de color y geometría dentro del propio componente:

```ts
const COLORS = {
  gridBg: '#0a0a18',
  gridLine: 'rgba(232,232,240,0.06)',
  path: '#2a2a3a',
  pathEdge: '#1a1a24',
  buildable: 'rgba(0,245,255,0.04)',
  castle: '#e8e8f0', // var(--ink)
  towerTurret: '#00f5ff', // var(--cyan)
  towerCannon: '#f5ff00', // var(--yellow)
  towerFrost: '#00ff88', // var(--green)
  towerRangeGhost: 'rgba(0,245,255,0.12)',
  enemyGrunt: '#ff006e', // var(--magenta)
  enemyScout: '#f5ff00', // var(--yellow)
  enemyBrute: '#aa00ff',
  enemyHpBarBg: 'rgba(0,0,0,0.5)',
  enemyHpBarFill: '#00ff88',
  projectileTurret: '#00f5ff',
  projectileCannon: '#f5ff00',
  projectileFrost: '#00ff88',
  splashRing: 'rgba(245,255,0,0.35)',
  slowAura: 'rgba(0,255,136,0.35)',
  hud: '#e8e8f0', // var(--ink)
  hudGold: '#f5ff00', // var(--yellow)
  invalidFlash: 'rgba(255,0,110,0.35)',
  validFlash: 'rgba(0,255,136,0.35)',
};
```

Clase de cover nueva (a agregar en `app/globals.css`, junto al resto de `.cover-*`):

```css
.cover-torres {
  background: linear-gradient(180deg, #0a0a2a, #0a0a18);
}
.cover-torres::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(var(--cyan), var(--cyan)) 20% 55% / 14% 45% no-repeat,
    linear-gradient(var(--cyan), var(--cyan)) 62% 40% / 14% 60% no-repeat,
    conic-gradient(
        from 0deg,
        var(--cyan) 0 25%,
        transparent 0 50%,
        var(--cyan) 0 75%,
        transparent 0 100%
      )
      20% 45% / 14% 10% no-repeat,
    conic-gradient(
        from 0deg,
        var(--cyan) 0 25%,
        transparent 0 50%,
        var(--cyan) 0 75%,
        transparent 0 100%
      )
      62% 30% / 14% 10% no-repeat,
    repeating-linear-gradient(
        90deg,
        rgba(232, 232, 240, 0.35) 0 6px,
        transparent 6px 18px
      )
      0 88% / 100% 6px no-repeat;
  filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
}
```

---

## Implementation plan

1. **Definir constantes de color dentro de `CastleGuardGame.tsx`** — trasladar la paleta
   del data model a una constante `COLORS` en TypeScript, evitando leer
   `getComputedStyle` sobre variables CSS en cada frame (por rendimiento del game loop).
   Verificación: el canvas se renderiza con la paleta neón consistente con el resto de
   la plataforma (cian/magenta/amarillo/verde sobre fondo oscuro).

2. **Dibujar el tablero por capas** en cada `draw()`:
   - Fondo del grid: `fillRect` por celda con `COLORS.gridBg`, líneas de grid sutiles
     (`COLORS.gridLine`) y celdas del camino resaltadas con `COLORS.path` más un borde
     `COLORS.pathEdge`.
   - Castillo: un bloque con almenas simples (varios `fillRect` pequeños en la parte
     superior) en la celda final del camino, color `COLORS.castle`, con un pequeño
     brillo (`shadowBlur`) que pulsa según las vidas restantes (más tenue con pocas
     vidas).
   - Torretas: base cuadrada + un cañón/orbe giratorio hacia el enemigo más cercano en
     rango, color por tipo (`COLORS.towerTurret`/`towerCannon`/`towerFrost`), con un
     anillo fantasma semitransparente (`COLORS.towerRangeGhost`) mostrando su rango solo
     mientras el tipo está seleccionado para construir (no en todas las torretas a la
     vez, para no saturar la vista).
   - Enemigos: círculos de color por tipo (`COLORS.enemyGrunt`/`enemyScout`/
     `enemyBrute`) con radio proporcional a su vida máxima, barra de vida delgada encima
     (`COLORS.enemyHpBarBg` + `COLORS.enemyHpBarFill`) y un aura translúcida
     (`COLORS.slowAura`) mientras están ralentizados por la torre de escarcha.
   - Proyectiles: pequeños círculos o líneas cortas de color por torreta de origen
     (`COLORS.projectileTurret`/`projectileCannon`/`projectileFrost`); el impacto del
     cañón dibuja un anillo expansivo breve (`COLORS.splashRing`) del tamaño de su
     `splashRadius`.
   - Feedback de colocación: destello breve (`COLORS.validFlash`/`invalidFlash`) sobre la
     celda clicada, según si la construcción tuvo éxito o no.
     Verificación: cada elemento es visualmente distinguible (tipo de torreta, tipo de
     enemigo, proyectil de origen) a simple vista, sin necesidad de assets externos.

3. **Dibujar HUD interno del canvas** — oro (`COLORS.hudGold`), vidas del castillo
   (icono simple + número), oleada actual, cuenta regresiva de la próxima oleada (barra
   o número descendente) y la torreta actualmente seleccionada (resaltada entre los 3
   íconos de torreta), en la esquina superior del canvas, con tipografía monoespaciada
   consistente con el resto de HUDs internos (Tetris/Arkanoid/Frogger).
   Verificación: el HUD interno es legible sobre el fondo del tablero en todo momento,
   incluso con enemigos y proyectiles superpuestos.

4. **Agregar `.cover-torres` a `app/globals.css`** — insertar la clase del data model
   junto al resto de bloques `.cover-*` (tras `.cover-duelo`). Confirmar que el INSERT
   de `games` (spec 02) usa `cover: 'cover-torres'`.
   Verificación: la card de CASTLE GUARD en `/games` y `/games/castle-guard` renderiza
   el gradiente azul oscuro con las dos siluetas de torre cian y la línea de almenas
   inferior.

5. **HUD React de la plataforma** — en `app/games/castle-guard/play/page.tsx`, mostrar
   `score`, `lives` (mismo patrón visual que el resto de juegos) y `level` etiquetado
   como "OLEADA" (`String(level).padStart(2, '0')`), reutilizando las clases
   `.hud-stat`, `.lives`, `.level` ya presentes en el CSS global.
   Verificación: el HUD React refleja los mismos valores que el HUD interno del canvas
   en tiempo real.

---

## Acceptance criteria

- [ ] Todos los elementos visuales del juego (grid, camino, castillo, torretas,
      enemigos, proyectiles, splash) se dibujan con primitivas de Canvas 2D, sin
      ninguna imagen externa cargada vía `drawImage`.
- [ ] La paleta de color usa los tonos neón ya establecidos en la plataforma
      (cian/magenta/amarillo/verde) sobre fondos oscuros, coherente con el resto de
      juegos.
- [ ] Cada tipo de torreta y cada tipo de enemigo es visualmente distinguible por color
      y forma en todo momento.
- [ ] Los enemigos ralentizados por la torre de escarcha muestran un aura visual
      distinta a los enemigos en velocidad normal.
- [ ] El HUD interno del canvas muestra oro, vidas del castillo, oleada, cuenta
      regresiva y torreta seleccionada, legibles sobre el fondo del tablero.
- [ ] `app/globals.css` incluye la nueva clase `.cover-torres` junto al resto de bloques
      `.cover-*`, sin modificar ninguna clase de cover existente.
- [ ] La card de CASTLE GUARD en `/games` y `/games/castle-guard` usa `cover-torres`.
- [ ] El HUD React de la plataforma (`app/games/castle-guard/play/page.tsx`) refleja
      score, vidas y oleada en tiempo real, con el mismo patrón visual que
      Asteroids/Arkanoid/Frogger.
- [ ] No se añade ningún archivo a `public/games/castle-guard/` (no hay assets que
      copiar).

---

## Decisions

- **Sí: Todo dibujado con primitivas de canvas, sin sprites** — igual que FROGGER, el
  concepto (grid, círculos, rectángulos) no requiere arte pixelado para ser legible.
  Razón: la mecánica de tower defense se apoya en formas geométricas simples y colores
  diferenciados, no en detalle artístico; introducir sprites añadiría trabajo sin
  mejorar la jugabilidad del MVP.

- **Sí: Nueva clase `.cover-torres`** — a diferencia de FROGGER (que reutilizó
  `.cover-rana` ya existente y sin usar), ninguna clase de cover libre actual
  (`cover-glot`, `cover-invaders`, `cover-duelo`) evoca una fortaleza o torres; todas
  están visualmente comprometidas con otros conceptos. Razón: forzar la reutilización de
  una clase temáticamente incorrecta sería peor que el costo bajo de agregar un bloque
  CSS nuevo siguiendo el mismo patrón (`background` + `::after` con gradientes).

- **Sí: Anillo de rango solo visible para el tipo de torreta seleccionado** — no se
  dibuja el rango de todas las torretas colocadas todo el tiempo. Razón: con varias
  torretas en el tablero, mostrar todos los anillos a la vez satura la vista y dificulta
  seguir a los enemigos; mostrar el rango solo del tipo activo ayuda a planear la
  próxima colocación sin ruido visual.

- **Sí: Constantes de color en TypeScript, no lectura de variables CSS en runtime** — se
  traduce la paleta a valores hex fijos en el propio componente. Razón: evitar
  `getComputedStyle` dentro del game loop por rendimiento; mismo patrón que `COLORS` en
  FROGGER y `FRUIT_ATLAS` en Snake.

- **Sí: HUD interno + HUD React (doble HUD)** — el canvas dibuja su propio HUD
  (incluyendo oro y cuenta regresiva de oleada, que no forman parte del contrato de
  props hacia React) y React refleja score/vidas/oleada en el HUD de la plataforma.
  Razón: consistencia con Tetris/Arkanoid/Snake/Frogger.

- **No: Sonido** — se descarta para este MVP. Razón: no es parte del núcleo mínimo
  jugable de un tower defense; se puede añadir en una iteración futura reutilizando el
  patrón de `ball-bounce.mp3`/`break-sound.mp3` de Arkanoid si se decide incorporar audio
  más adelante.

- **No: Animaciones de partículas complejas** — splash y destellos se resuelven con
  primitivas simples (anillos, círculos semitransparentes), no con sistemas de
  partículas. Razón: con varios enemigos y torretas activos a la vez, un sistema de
  partículas más pesado arriesga el rendimiento del game loop sin aportar valor
  jugable proporcional.

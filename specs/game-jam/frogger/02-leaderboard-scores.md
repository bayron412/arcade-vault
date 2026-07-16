# SPEC GAME-JAM — Leaderboard & Scores: FROGGER

> **Estado:** Propuesto
> **Depende de:** 01-core-game.md
> **Fecha:** 2026-07-14
> **Objetivo:** Conectar FROGGER al modelo de datos existente de Supabase (`games`,
> `scores`), con guardado de partidas, modal de game over y leaderboard top 10, sin
> introducir tablas ni tipos nuevos.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `frogger` a la tabla `games` en Supabase.
- Guardado de cada partida terminada en la tabla `scores`
  (`{ game_id: 'frogger', player_name, score, user_id: null }`).
- Modal React de game over en `app/games/frogger/play/page.tsx`: pre-rellena el nombre
  desde `localStorage.getItem('av_player_name')`, persiste el nombre elegido al confirmar,
  y deshabilita el botón de guardado tras el primer envío (sin doble inserción).
- Leaderboard top 10 en `/games/frogger` (ruta genérica `app/games/[id]/page.tsx`, ya
  existente y agnóstica al juego).
- Aparición automática de FROGGER como tab en `/hall-of-fame`, sin cambios adicionales
  de código (la página ya itera sobre la tabla `games`).

**Fuera de alcance:**

- Crear las tablas `games` o `scores` en Supabase — ya existen.
- Supabase Auth — `user_id` se almacena como `null` en todos los scores.
- RLS (Row Level Security) — se configura en un spec futuro de seguridad.
- Realtime — el leaderboard no se actualiza en vivo; solo al cargar la página.
- Paginación del leaderboard — se muestran los top 10 fijos.
- Actualización automática de `best`/`plays` en la tabla `games` — campos calculados al
  vuelo desde `scores` (mismo patrón que el resto de juegos, ver `app/games/[id]/page.tsx`).

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río antes de que se acabe el tiempo.',
  'Guía a tu rana desde el césped de salida hasta uno de los cinco nidos de meta, sorteando el tráfico y saltando entre troncos y tortugas de un río que nunca deja de moverse. Un mal salto, una corriente que te arrastra fuera del tablero o el reloj llegando a cero, y pierdes una vida. Llena las cinco metas para subir de nivel y enfrentar carriles cada vez más rápidos.',
  'ARCADE',
  'cover-rana',
  'green'
);
```

### Guardado de score (cliente browser)

Reutiliza `ScoreRow` de `lib/supabase/types.ts` sin modificaciones:

```ts
await supabase.from('scores').insert({
  game_id: 'frogger',
  player_name: name,
  score,
  user_id: null,
});
```

No se introducen tablas ni tipos TypeScript nuevos.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `frogger` aparece en el Table Editor; `/games` muestra la card
   de FROGGER con `cover-rana`, color `green` y categoría `ARCADE`.

2. **Wiring del modal de game over en `app/games/frogger/play/page.tsx`**:
   - Estado local `over`, `name`, `saved` (mismo patrón que
     `app/games/asteroids/play/page.tsx`).
   - Al abrir el modal (`over === true`), leer `localStorage.getItem('av_player_name')`
     y pre-rellenar `name` si existe (fallback: `'INVITADO'`).
   - Botón "GUARDAR PUNTUACIÓN": al confirmar, persiste `name` en
     `localStorage.setItem('av_player_name', name)`, inserta el score en Supabase con
     `{ game_id: 'frogger', player_name: name, score, user_id: null }` y marca
     `saved: true` para deshabilitar el botón y evitar doble inserción.
   - Botón "JUGAR DE NUEVO": reinicia `score`, `lives` (3), `level` (1), `paused`,
     `over`, `saved` e incrementa `gameKey` para remontar `FroggerGame` desde cero.
     Verificación: tras una partida, el modal muestra la puntuación final; guardar
     inserta una fila nueva en `scores` sin duplicados.

3. **Verificación del leaderboard** — sin cambios de código adicionales, `/games/frogger`
   (ruta genérica `app/games/[id]/page.tsx`) consulta `scores` filtrando por
   `game_id = 'frogger'`, ordenado por `score` descendente, límite 10.
   Verificación: tras guardar una partida, el score aparece en `/games/frogger` al
   recargar, con el mensaje "Sé el primero en entrar al salón de la fama" cuando la
   tabla está vacía para este juego.

4. **Verificación en `/hall-of-fame`** — la página ya itera sobre todos los juegos de la
   tabla `games`; al existir la fila `frogger`, aparece automáticamente como tab nuevo
   sin cambios de código.
   Verificación: `/hall-of-fame` muestra un tab "FROGGER" con su leaderboard.

5. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `frogger` existe en la tabla `games` de Supabase con los valores del data
      model.
- [ ] La card de FROGGER aparece en `/games` con cover `cover-rana`, color `green` y
      categoría `ARCADE`.
- [ ] Al terminar una partida, aparece el modal React de game over con la puntuación
      final.
- [ ] Al abrir el modal, el campo de nombre se pre-rellena con `av_player_name` de
      localStorage si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en
      localStorage.
- [ ] El botón "GUARDAR PUNTUACIÓN" se deshabilita tras el primer envío (sin doble
      inserción).
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero (score 0, 3 vidas, nivel 1).
- [ ] El score guardado aparece en `/games/frogger` (top 10) y en `/hall-of-fame` al
      recargar.
- [ ] Cuando no hay scores para FROGGER, el leaderboard muestra "Sé el primero en entrar
      al salón de la fama".
- [ ] `/hall-of-fame` muestra un tab para FROGGER sin cambios de código adicionales.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Un único INSERT, sin nuevas tablas** — se reutilizan `games` y `scores` del
  spec 06 de la plataforma. Razón: el modelo genérico ya soporta cualquier juego con
  score numérico; FROGGER no necesita columnas adicionales (vidas/nivel/tiempo no se
  persisten, solo el score final).

- **Sí: `user_id: null` en todos los inserts** — no existe Supabase Auth integrada en el
  flujo de juego todavía. Razón: consistencia con Asteroids/Tetris/Arkanoid/Snake.

- **Sí: Leaderboard vía la ruta genérica `[id]/play`** — no se crea una página de detalle
  específica para FROGGER. Razón: `app/games/[id]/page.tsx` ya es agnóstica al juego y
  funciona con cualquier fila nueva de `games` sin cambios de código.

- **Sí: Reaparición automática en `/hall-of-fame`** — sin tocar esa página. Razón: ya
  itera dinámicamente sobre la tabla `games`; añadir una fila es suficiente.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: se mitiga en un spec futuro de seguridad, igual que el resto de juegos.

- **No: Realtime en el leaderboard** — los scores se ven al recargar. Razón: la
  complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.

- **No: Persistir vidas/nivel/tiempo restante en `scores`** — solo se guarda `score`.
  Razón: `ScoreRow` ya define el contrato mínimo compartido por todos los juegos; ampliar
  el esquema por juego rompería la reutilización de la tabla.

# SPEC GAME-JAM — Leaderboard & Scores: CASTLE GUARD

> **Estado:** Propuesto
> **Depende de:** 01-core-game.md
> **Fecha:** 2026-07-18
> **Objetivo:** Conectar CASTLE GUARD al modelo de datos existente de Supabase (`games`,
> `scores`), con guardado de partidas, modal de game over y leaderboard top 10, sin
> introducir tablas ni tipos nuevos.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `castle-guard` a la tabla `games` en Supabase.
- Guardado de cada partida terminada en la tabla `scores`
  (`{ game_id: 'castle-guard', player_name, score, user_id: null }`).
- Modal React de game over en `app/games/castle-guard/play/page.tsx`: pre-rellena el
  nombre desde `localStorage.getItem('av_player_name')`, persiste el nombre elegido al
  confirmar, y deshabilita el botón de guardado tras el primer envío (sin doble
  inserción).
- Leaderboard top 10 en `/games/castle-guard` (ruta genérica `app/games/[id]/page.tsx`,
  ya existente y agnóstica al juego).
- Aparición automática de CASTLE GUARD como tab en `/hall-of-fame`, sin cambios
  adicionales de código (la página ya itera sobre la tabla `games`).

**Fuera de alcance:**

- Crear las tablas `games` o `scores` en Supabase — ya existen.
- Supabase Auth — `user_id` se almacena como `null` en todos los scores.
- RLS (Row Level Security) — se configura en un spec futuro de seguridad.
- Realtime — el leaderboard no se actualiza en vivo; solo al cargar la página.
- Paginación del leaderboard — se muestran los top 10 fijos.
- Persistir oro, vidas u oleada alcanzada — solo se guarda el `score` final, igual que el
  resto de juegos.
- Actualización automática de `best`/`plays` en la tabla `games` — campos calculados al
  vuelo desde `scores` (mismo patrón que el resto de juegos, ver `app/games/[id]/page.tsx`).

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'castle-guard',
  'CASTLE GUARD',
  'Coloca torres a lo largo del camino para detener oleadas de invasores.',
  'Defiende tu castillo construyendo torretas junto a un camino serpenteante mientras oleadas cada vez más numerosas de invasores avanzan hacia tus murallas. Cada enemigo eliminado te da el oro que necesitas para levantar más defensas; cada uno que se te escapa cuesta vidas del castillo. Sobrevive tantas oleadas como puedas antes de que tus muros caigan.',
  'ARCADE',
  'cover-torres',
  'cyan'
);
```

### Guardado de score (cliente browser)

Reutiliza `ScoreRow` de `lib/supabase/types.ts` sin modificaciones:

```ts
await supabase.from('scores').insert({
  game_id: 'castle-guard',
  player_name: name,
  score,
  user_id: null,
});
```

No se introducen tablas ni tipos TypeScript nuevos.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `castle-guard` aparece en el Table Editor; `/games` muestra la
   card de CASTLE GUARD con `cover-torres`, color `cyan` y categoría `ARCADE`.

2. **Wiring del modal de game over en `app/games/castle-guard/play/page.tsx`**:
   - Estado local `over`, `name`, `saved` (mismo patrón que
     `app/games/asteroids/play/page.tsx` y `app/games/frogger/play/page.tsx`).
   - Al abrir el modal (`over === true`), leer `localStorage.getItem('av_player_name')`
     y pre-rellenar `name` si existe (fallback: `'INVITADO'`).
   - Botón "GUARDAR PUNTUACIÓN": al confirmar, persiste `name` en
     `localStorage.setItem('av_player_name', name)`, inserta el score en Supabase con
     `{ game_id: 'castle-guard', player_name: name, score, user_id: null }` y marca
     `saved: true` para deshabilitar el botón y evitar doble inserción.
   - Botón "JUGAR DE NUEVO": reinicia `score`, `lives` (`STARTING_LIVES`), `level` (1),
     `paused`, `over`, `saved` e incrementa `gameKey` para remontar `CastleGuardGame`
     desde cero.
     Verificación: tras una partida, el modal muestra la puntuación final; guardar
     inserta una fila nueva en `scores` sin duplicados.

3. **Verificación del leaderboard** — sin cambios de código adicionales, `/games/castle-guard`
   (ruta genérica `app/games/[id]/page.tsx`) consulta `scores` filtrando por
   `game_id = 'castle-guard'`, ordenado por `score` descendente, límite 10.
   Verificación: tras guardar una partida, el score aparece en `/games/castle-guard` al
   recargar, con el mensaje "Sé el primero en entrar al salón de la fama" cuando la tabla
   está vacía para este juego.

4. **Verificación en `/hall-of-fame`** — la página ya itera sobre todos los juegos de la
   tabla `games`; al existir la fila `castle-guard`, aparece automáticamente como tab
   nuevo sin cambios de código.
   Verificación: `/hall-of-fame` muestra un tab "CASTLE GUARD" con su leaderboard.

5. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `castle-guard` existe en la tabla `games` de Supabase con los valores del
      data model.
- [ ] La card de CASTLE GUARD aparece en `/games` con cover `cover-torres`, color `cyan`
      y categoría `ARCADE`.
- [ ] Al terminar una partida, aparece el modal React de game over con la puntuación
      final.
- [ ] Al abrir el modal, el campo de nombre se pre-rellena con `av_player_name` de
      localStorage si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en
      localStorage.
- [ ] El botón "GUARDAR PUNTUACIÓN" se deshabilita tras el primer envío (sin doble
      inserción).
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero (score 0, vidas y oleada
      iniciales).
- [ ] El score guardado aparece en `/games/castle-guard` (top 10) y en `/hall-of-fame` al
      recargar.
- [ ] Cuando no hay scores para CASTLE GUARD, el leaderboard muestra "Sé el primero en
      entrar al salón de la fama".
- [ ] `/hall-of-fame` muestra un tab para CASTLE GUARD sin cambios de código adicionales.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Un único INSERT, sin nuevas tablas** — se reutilizan `games` y `scores` del
  spec 06 de la plataforma. Razón: el modelo genérico ya soporta cualquier juego con
  score numérico; CASTLE GUARD no necesita columnas adicionales (oro, vidas u oleada
  alcanzada no se persisten, solo el score final).

- **Sí: `user_id: null` en todos los inserts** — no existe Supabase Auth integrada en el
  flujo de juego todavía. Razón: consistencia con Asteroids/Tetris/Arkanoid/Snake/Frogger.

- **Sí: Leaderboard vía la ruta genérica `[id]/play`** — no se crea una página de detalle
  específica para CASTLE GUARD. Razón: `app/games/[id]/page.tsx` ya es agnóstica al juego
  y funciona con cualquier fila nueva de `games` sin cambios de código.

- **Sí: Reaparición automática en `/hall-of-fame`** — sin tocar esa página. Razón: ya
  itera dinámicamente sobre la tabla `games`; añadir una fila es suficiente.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: se mitiga en un spec futuro de seguridad, igual que el resto de juegos.

- **No: Realtime en el leaderboard** — los scores se ven al recargar. Razón: la
  complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.

- **No: Persistir oro/vidas/oleada alcanzada en `scores`** — solo se guarda `score`.
  Razón: `ScoreRow` ya define el contrato mínimo compartido por todos los juegos; ampliar
  el esquema por juego rompería la reutilización de la tabla.

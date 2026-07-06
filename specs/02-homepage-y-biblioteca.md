# SPEC 02 — Homepage y reorganización de rutas

> **Status:** Aprobado
> **Depends on:** 01-mvp-visual-screens
> **Date:** 2026-07-06
> **Objective:** Reemplazar la página de biblioteca en `/` por una nueva homepage basada en `references/home-about/home.jsx`, moviendo la biblioteca actual a `/games`.

---

## Scope

**In:**

- Página `/` (nueva homepage) — hero con silhouettes flotantes decorativas, sección "¿Por qué Arcade Vault?" (feature grid), preview de 6 juegos (`MiniCard`), stats, actividad en vivo (ticker de puntuaciones + top jugadores, datos mock estáticos), sección de precios (plan único gratuito + FAQ), CTA final. Basada en `references/home-about/home.jsx`.
- Página `/games` (biblioteca) — contenido actual de `app/page.tsx` (hero flicker, filtros, grid de `GameCard`) movido tal cual a esta nueva ruta.
- `components/MiniCard.tsx` — nuevo componente compacto (portada + título + categoría) para el preview de juegos del home, usando `GAMES` de `app/data`.
- `components/Nav.tsx` — actualizar enlaces a: Inicio (`/`), Biblioteca (`/games`), Salón de la Fama (`/hall-of-fame`), Acerca de (`/about`, aunque esta ruta no exista todavía y dé 404).
- `app/globals.css` — añadir las clases y animaciones que falten para el home (`.home-hero`, `.home-silos`, `.feature-grid`, `.mini-card`, `.home-stats`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, `.home-final`, etc.), portadas del prototipo `home.jsx`/`styles.css`.
- Actualizar cualquier enlace interno existente que apunte a la biblioteca en `/` para que apunte a `/games`, incluyendo los 4 puntos identificados: redirección tras login/invitado en `/auth`, botón "VOLVER AL VAULT" en `/games/[id]`, botón magenta post-partida en `/games/[id]/play`, y "VOLVER A LA BIBLIOTECA" en `/hall-of-fame`.

**Fuera de alcance (para specs futuros):**

- Página `/about` — el contenido de `references/home-about/about.jsx` no se implementa en este spec. El link del nav quedará apuntando a `/about` aunque no exista (404 esperado).
- Cualquier dato real de actividad/leaderboard — la sección "Actividad en vivo" del home usa arrays mock estáticos, igual que el prototipo, sin conectar a `seededScores` ni a una API.
- Cambios a `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame` más allá de actualizar sus enlaces hacia `/` (ver arriba) — no se tocan más allá de eso.
- Lógica de créditos, pagos o planes reales — la sección de precios es puramente visual (plan gratuito fijo).

---

## Data model

No se introducen nuevas estructuras en `app/data/` — el preview de juegos reutiliza `Game` de `app/data/games.ts` tal cual.

Los datos de la sección "Actividad en vivo" son mock estático, definidos como arrays inline dentro de `app/page.tsx` (igual que en el prototipo), sin exportarse ni persistirse:

```ts
// tipos locales en app/page.tsx, no exportados

interface TickerEntry {
  player: string;
  game: string;
  score: number;
  time: string;   // e.g. "hace 2 min"
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
}

interface TopPlayerEntry {
  rank: number;
  player: string;
  score: number;
}
```

---

## Implementation plan

1. **Mover la biblioteca a `/games`** — crear `app/games/page.tsx` con el contenido actual de `app/page.tsx` (hero, filtros, grid `GameCard`) sin cambios funcionales. Verificación: `/games` muestra exactamente lo que hoy muestra `/`.

2. **Crear `components/MiniCard.tsx`** — componente compacto que recibe un `Game` y renderiza portada + título + categoría, navegando a `/games/[id]` al hacer click (usando `next/link` o `useRouter`). Verificación: renderiza sin errores de tipos con los datos de `GAMES`.

3. **Añadir clases a `app/globals.css`** — portar de `references/home-about/styles.css` las reglas para `.home-hero`, `.home-silos` (+ animaciones de las 8 silhouettes), `.feature-grid`/`.feature-card`, `.mini-rail`/`.mini-card`, `.home-stats`/`.stat-block`, `.activity-grid`/`.ticker`/`.tick-row`/`.top-list`/`.top-row`, `.pricing-grid`/`.price-card`/`.pricing-faq`, `.home-final`. Prefijo `av-`/nombres ya usados por el prototipo, revisando duplicados con lo ya migrado en spec 01. Verificación: el servidor de desarrollo corre sin errores de CSS.

4. **Implementar `app/page.tsx` (nueva homepage)** — reemplazar el contenido actual (movido en el paso 1) por la estructura de `home.jsx`: hero con `FloatingSilhouettes`, sección features (`FeatureIcon`), preview de 6 juegos con `MiniCard` sobre `GAMES.slice(0, 6)`, stats, actividad en vivo con datos mock inline, pricing con FAQ, CTA final. Todos los botones de acción navegan a `/games` o `/auth` según el spec. `"use client"` solo si se requiere estado/efectos (ej. `useReveal` con `IntersectionObserver`). Verificación: `/` muestra las 7 secciones del prototipo sin errores de consola.

5. **Actualizar `components/Nav.tsx`** — cambiar el array `LINKS` a: `{ href: '/', label: 'Inicio' }`, `{ href: '/games', label: 'Biblioteca' }`, `{ href: '/hall-of-fame', label: 'Salón de la Fama' }`, `{ href: '/about', label: 'Acerca de' }`. Verificación: los 4 enlaces aparecen en desktop y en el drawer móvil; el estado activo resalta la ruta actual.

6. **Actualizar los 4 enlaces existentes a `/`** — cambiar `href="/"` por `href="/games"` en el botón "VOLVER AL VAULT" (`app/games/[id]/page.tsx`), el botón magenta post-partida (`app/games/[id]/play/page.tsx`), "VOLVER A LA BIBLIOTECA" (`app/hall-of-fame/page.tsx`), y cambiar `router.push('/')` por `router.push('/games')` en ambos casos de `app/auth/page.tsx` (login y "jugar como invitado"). Verificación: cada uno de esos 4 flujos termina en `/games`, no en el nuevo home.

7. **Verificación end-to-end** — recorrer: `/` (nuevo home) → click "Explorar juegos" → `/games` (biblioteca) → click una card → `/games/[id]` → volver → `/` → click "Ver salón" → `/hall-of-fame` → click "Acerca de" → confirmar 404 esperado → volver a `/`. Confirmar responsive en 375px y sin errores de consola.

---

## Acceptance criteria

**Rutas**

- [ ] `/games` muestra el mismo contenido (hero, filtros, grid) que hoy muestra `/`.
- [ ] `/` muestra la nueva homepage basada en `home.jsx`.
- [ ] `/about` no existe todavía y da 404 al navegar desde el nav.

**Homepage (`/`)**

- [ ] El hero muestra las 8 silhouettes decorativas flotando y el texto "EL ARCADE CLÁSICO ESTÁ DE VUELTA".
- [ ] El botón "EXPLORAR JUEGOS" y "INSERTAR MONEDA" navegan a `/games`.
- [ ] El botón "CREAR CUENTA" y el CTA del plan de precios navegan a `/auth`.
- [ ] La sección "¿Por qué Arcade Vault?" muestra las 4 feature cards con sus iconos pixel.
- [ ] La sección "Juegos disponibles ahora" muestra 6 `MiniCard` generadas desde `GAMES`, y cada una navega a `/games/[id]` al hacer click.
- [ ] El botón "VER TODOS LOS JUEGOS" navega a `/games`.
- [ ] La sección de stats muestra los 3 bloques (juegos, partidas, ranking).
- [ ] La sección "Actividad en vivo" muestra el ticker de puntuaciones y el top 5 de jugadores con datos mock.
- [ ] El botón "VER SALÓN" navega a `/hall-of-fame`.
- [ ] La sección de precios muestra el plan único gratuito y las 3 preguntas de FAQ.
- [ ] El CTA final navega a `/games`.
- [ ] Las animaciones `reveal` (fade/slide al hacer scroll) funcionan en todas las secciones marcadas.

**Nav**

- [ ] El menú muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de" en ese orden, tanto en desktop como en el drawer móvil.
- [ ] "Inicio" apunta a `/`, "Biblioteca" a `/games`.
- [ ] El estado activo del nav resalta la ruta actual correctamente en `/` y en `/games`.

**Visual / global**

- [ ] No hay errores en la consola del navegador en `/` ni en `/games`.
- [ ] El layout de la homepage es usable en viewport de 375px de ancho (móvil).

**Enlaces a la biblioteca**

- [ ] Tras iniciar sesión o entrar como invitado en `/auth`, la app redirige a `/games`.
- [ ] "VOLVER AL VAULT" en `/games/[id]` navega a `/games`.
- [ ] El botón magenta post-partida en `/games/[id]/play` navega a `/games`.
- [ ] "VOLVER A LA BIBLIOTECA" en `/hall-of-fame` navega a `/games`.

---

## Decisions

- **Sí:** Mover el contenido actual de `/` a `/games` en vez de crear una ruta `/biblioteca` nueva. `/games` ya existe como padre de `/games/[id]` y `/games/[id]/play`; añadir `/games/page.tsx` mantiene la jerarquía coherente sin introducir un segmento nuevo.

- **No:** Renombrar las rutas hijas (`/games/[id]`) para acomodar la biblioteca en otro lado. Ya están implementadas y funcionando (spec 01); no hay razón para tocarlas.

- **Sí:** `MiniCard` como componente nuevo y separado de `GameCard`. El diseño del preview en el home (portada + título + categoría, sin stats ni botón "JUGAR") es visualmente distinto y más compacto que la card completa de la biblioteca; forzar reuso de `GameCard` degradaría el diseño del prototipo.

- **No:** Reusar `GameCard` en el home. Fue evaluado y descartado porque el prototipo usa una card deliberadamente más simple para el rail de preview.

- **Sí:** Datos de "Actividad en vivo" como arrays mock inline en el componente, sin pasar por `app/data`. Es contenido puramente decorativo para transmitir "vida" en la plataforma; no representa datos reales de usuarios ni debe tratarse como fuente de verdad.

- **No:** Conectar la actividad en vivo a `seededScores`. Se descartó porque mezclaría datos "deterministas por semilla" (pensados para leaderboards reales de un juego) con una sección que es puramente ambiental/de marketing.

- **Sí:** Dejar el link "Acerca de" apuntando a `/about` aunque la ruta no exista aún (404 esperado). Refleja fielmente el nav del prototipo y distingue claramente el trabajo pendiente sin bloquear este spec con una implementación placeholder de relleno.

- **No:** Crear un `/about` placeholder tipo "próximamente" en este spec. Se decidió no hacerlo para no mezclar dos objetivos (home + about) en un mismo spec; about.jsx tiene suficiente contenido propio (formulario de contacto, highlights) para merecer su propio spec.

- **Sí:** Reescribir los 4 enlaces existentes que hoy navegan a `/` (login/invitado en auth, "VOLVER AL VAULT" en detalle, botón post-partida en el reproductor, "VOLVER A LA BIBLIOTECA" en hall-of-fame) para que apunten a `/games`. Preserva el comportamiento original de esos flujos (volver a jugar), que se rompería si cayeran en el nuevo home con hero y precios de por medio.

- **No:** Dejar esos 4 enlaces apuntando a `/` sin cambios. Se descartó porque introduciría un paso extra innecesario (pasar por el home) justo en los flujos donde el usuario quiere volver a jugar lo antes posible.

---

## Risks

| Riesgo | Mitigación |
|---|---|
| Puede quedar algún enlace a `/` sin actualizar si aparece uno nuevo fuera de los 4 ya identificados (por ejemplo, dentro de componentes compartidos no revisados). | Grep de `href="/"` y `push('/')` en `app/` y `components/` antes de dar por cerrado el paso 6 del plan, para confirmar que no quedan casos sueltos. |
| El hook `useReveal` (IntersectionObserver) se usa en el home junto a los efectos `tilt` de `GameCard` en `/games`; si ambos corren en la misma sesión de navegación puede haber jank en hardware lento. | Verificar manualmente la transición `/` → `/games` en el paso 6 del plan; usar `will-change: transform` donde ya se aplica en `.card`. |
| Portar clases CSS de `references/home-about/styles.css` puede chocar con nombres ya definidos en `app/globals.css` (spec 01 usa convenciones similares). | Revisar `globals.css` antes de pegar cada bloque nuevo; usar los nombres tal cual del prototipo (`home-*`, `mini-*`) que no colisionan con lo ya migrado (`av-*`, `card`, `chip`). |

---

## What is **not** in this spec

- Página `/about` con el diseño completo de `about.jsx` (highlights, formulario de contacto).
- Datos reales de actividad/leaderboard en el home — todo es mock estático.
- Cambios a `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame` más allá de actualizar sus enlaces hacia `/games`.
- Lógica de créditos, pagos o planes reales.

Cada uno de estos, si llega, va en su propio spec.

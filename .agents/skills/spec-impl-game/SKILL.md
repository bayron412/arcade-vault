---
name: spec-impl-game
description: Implementa un spec de juego aprobado (autodetecta un solo archivo specs/NN-<id>-game.md o una carpeta game-jam de 3 archivos specs/game-jam/<id>/), siguiendo el mismo flujo por fases de /spec-impl, y al terminar ejecuta en secuencia los agentes skin-designer y luego mobile-porter sobre el juego recién implementado.
disable-model-invocation: true
argument-hint: '<game-id | NN-nombre-spec | game-jam/<id>>'
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementador de specs de juego + skins + mobile

## Session context

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles (formato de un solo archivo):
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

Specs disponibles (formato game-jam, 3 archivos por carpeta):
!`ls specs/game-jam/ 2>/dev/null || echo "La carpeta specs/game-jam/ no existe"`

Configuración de creación de rama:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, sin archivo de config)"`

---

## Regla de delegación (DRY)

Este skill **no reimplementa** la lógica de implementación de specs. Antes de hacer nada:

1. Lee `.claude/skills/spec-impl/SKILL.md` completo.
2. Sigue **exactamente sus 4 fases** (identificar spec, validar estado, crear rama, implementar paso a paso),
   con las extensiones específicas de juego descritas abajo en cada fase.
3. Si `.claude/skills/spec-impl/SKILL.md` cambia en el futuro, este skill hereda ese cambio automáticamente —
   no dupliques su contenido aquí, solo las diferencias.

Después de completar las 4 fases de `spec-impl`, ejecuta la **Fase 5** (nueva, exclusiva de este skill) descrita
al final de este documento.

---

## Extensión a Fase 1 — Identificar el spec (autodetección de formato)

El argumento recibido es: `$ARGUMENTS`

En Arcade Vault existen **dos formatos de spec de juego**. Autodetecta cuál aplica:

**Formato A — game-jam (3 archivos).** Si `$ARGUMENTS` coincide con una carpeta bajo `specs/game-jam/`
(el usuario puede escribir `frogger`, `game-jam/frogger`, o `specs/game-jam/frogger`):

- El spec vive en `specs/game-jam/<game-id>/{01-core-game.md, 02-leaderboard-scores.md, 03-assets-visuals.md}`.
- `game-id` = nombre exacto de la carpeta.
- El estado canónico a validar (Fase 2) se lee en `01-core-game.md`.
- El plan de implementación combina los 3 archivos: `01-core-game.md` aporta mecánica y plan de pasos,
  `02-leaderboard-scores.md` aporta el modelo de datos/persistencia, `03-assets-visuals.md` aporta skins/estética inicial.

**Formato B — archivo único (`/add-game`).** Si no es una carpeta de game-jam, resuelve igual que `spec-impl`
normal: busca en `specs/` por nombre completo (`07-tetris-game`), solo número (`07`), o solo slug (`tetris-game`).

- Prioriza archivos con patrón `NN-<id>-game.md` — de ahí `game-id` = `<id>`.
- Si el archivo encontrado no sigue ese patrón (ej. es un spec no relacionado con un juego), avisa al usuario
  y pide confirmación de que efectivamente es un spec de juego antes de continuar.

**Si no se encuentra en ninguno de los dos formatos:** muestra ambos listados de contexto (specs/ y
specs/game-jam/) y pide al usuario que corrija el nombre. No continúes.

Guarda mentalmente el `game-id` resuelto — lo necesitarás en la Fase 5.

---

## Extensión a Fase 2 — Validar el estado del spec

Idéntico al gate de `spec-impl`: solo continúa si el estado significa "Aprobado" (en cualquier idioma).

- Formato A (game-jam): el estado se lee en `01-core-game.md`. Recuerda que los specs de game-jam **nacen en
  estado `Propuesto`** (generados por el agente `game-jam`) — eso NO cuenta como aprobado. El humano debe
  cambiarlo explícitamente a `Aprobado` antes de que este skill continúe. No relajes esta regla.
- Formato B: igual que `spec-impl` (típicamente `Borrador` → `Aprobado`).

Si el estado no significa aprobado, usa el mismo mensaje de error estándar de `spec-impl`, adaptando la
sugerencia de "usa `/spec [name]`" por "aprueba el spec manualmente o complétalo primero" cuando aplique
a specs de game-jam (que no se editan con `/spec`).

---

## Extensión a Fase 3 — Crear la rama

Deriva el nombre de rama según el formato:

- Formato A (game-jam): `spec-game-<game-id>` (ej. carpeta `frogger` → rama `spec-game-frogger`).
- Formato B (archivo único): igual que `spec-impl` — `spec-NN-slug` (ej. `07-tetris-game.md` → `spec-07-tetris-game`).

El resto del comportamiento (respetar `AutoCreateBranch`, confirmar la rama activa, mostrar resumen del spec)
es idéntico a `spec-impl`. Para el resumen del spec en formato A, combina el objetivo/alcance/plan/criterios
de los 3 archivos en un solo resumen legible.

---

## Extensión a Fase 4 — Implementar paso a paso

Mismo ritmo de trabajo que `spec-impl`: un paso del plan a la vez, mostrar diff, pausar y esperar confirmación.

- Formato A (game-jam): el plan de pasos numerados vive en `01-core-game.md`; intercala los pasos de
  `02-leaderboard-scores.md` (persistencia/Supabase) donde el propio archivo indique que deben integrarse.
- Formato B: igual que `spec-impl` estándar.

Al terminar el último paso, verifica los criterios de aceptación uno por uno, igual que `spec-impl`. Cuando
todos pasen, **no te detengas ahí** — continúa a la Fase 5 de este skill (spec-impl normal termina en este
punto; spec-impl-game no).

---

## Fase 5 — Agentes en secuencia: skin-designer → mobile-porter (exclusiva de este skill)

Solo se ejecuta cuando la implementación del spec terminó y los criterios de aceptación pasaron.

1. Usa el `game-id` resuelto en la Fase 1.
2. Confirma que `app/games/<game-id>/` existe (la implementación recién hecha debió crearlo). Si no existe,
   detente y avisa al usuario — no lances agentes sobre un juego que no quedó implementado.
3. Anuncia al usuario:

   ```
   ✅ Spec implementado y criterios de aceptación verificados.

   Ahora voy a ejecutar en secuencia (no en paralelo):
     1. skin-designer  → garantiza las skins de "<game-id>"
     2. mobile-porter   → agrega soporte táctil a "<game-id>" (se ejecuta después de que el anterior termine)
   ```

4. Lanza el agente **`skin-designer`** pasándole el `game-id` como input. **Espera a que termine por completo**
   antes de continuar — no lo lances en background sin esperar su resultado, y no lances el siguiente agente
   hasta tener la confirmación de que este terminó.
5. Solo cuando `skin-designer` haya terminado, lanza el agente **`mobile-porter`** con el mismo `game-id`.
   Nunca lances ambos en el mismo mensaje ni en paralelo — es una secuencia estricta: primero uno, después el otro.
6. Si alguno de los dos agentes no hace cambios porque su trabajo ya estaba completo (ej. el juego ya tenía
   las 4 skins, o ya estaba portado a mobile, o resulta ser uno de los 4 juegos base que `mobile-porter`
   nunca toca), trátalo como un resultado válido (no-op esperado) — repórtalo tal cual, no reintentes ni fuerces cambios.
7. Al terminar ambos, resume al usuario qué hizo cada agente (o que no hizo nada y por qué) y recuérdale:
   - Verificar visualmente en el servidor de desarrollo (puerto 3000).
   - Verificar el layout táctil en viewport móvil (390px) si `mobile-porter` hizo cambios.
   - Revisar el diff completo antes de mergear la rama.

---

## Reglas invariantes

- No relajes el gate de aprobación heredado de `spec-impl` — ni siquiera para specs de game-jam recién generados.
- No implementes nada fuera del alcance de los archivos del spec (uno o tres, según el formato detectado).
- Los agentes de la Fase 5 se ejecutan **estrictamente en serie**: `skin-designer` primero, `mobile-porter`
  después de que el primero termine. Nunca en paralelo.
- No toques `references/game-suggestions-todo.md`, `references/game-with-themes.md` ni
  `references/mobile-ported-games.md` directamente — esos registros los mantienen los propios agentes.

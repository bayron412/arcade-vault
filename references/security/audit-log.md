## Auditoría 2026-07-20 (foco: autenticación)

- Rama: `main` · Resultado global: 3 hallazgos (0 Crítico, 1 Alto, 1 Medio, 1 Info) — foco solicitado en el flujo de auth.
- Alcance de esta corrida: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`, `app/auth/page.tsx`, `app/auth/callback/route.ts`, `app/auth/reset-password/page.tsx`, `app/context/UserContext.tsx`, `proxy.ts`, `app/api/contact/route.ts`, inserts de `scores` en `app/games/*/play/page.tsx`, RLS/policies en Supabase.
- App — flujo de auth (contra spec 13 + checklist A de spec 14):
  - `lib/supabase/client.ts` / `server.ts`: ✓ usan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nunca `service_role`); `server.ts` maneja el error de `cookieStore.set` en contexto de Server Component con try/catch documentado (delegando el refresh de sesión a `proxy.ts`), consistente con el patrón oficial de `@supabase/ssr`.
  - `proxy.ts`: ✓ usa `supabase.auth.getUser()` (validado contra el servidor de Auth) en vez de `getSession()` para decidir el redirect — patrón correcto que evita confiar en un JWT no verificado. `matcher: '/auth'` redirige a `/` si ya hay sesión; coherente con el alcance de spec 13 (sin protección de rutas de juego, decisión explícita "No: middleware para proteger rutas").
  - `app/context/UserContext.tsx`: ✓ hidrata con `getSession()` y se suscribe a `onAuthStateChange`; no usa `localStorage.getItem('av_user')` (grep sin resultados en el repo). Nota: `getSession()` en cliente no es un límite de seguridad — la autorización real ocurre en RLS vía `auth.uid()` en el servidor de Supabase, así que esto es aceptable para estado de UI, no un hallazgo.
  - `app/auth/page.tsx`: ✓ `PASSWORD_REGEX` (min 8, mayúscula, minúscula, dígito, símbolo) se evalúa antes de `supabase.auth.signUp` y bloquea el submit si falla; login no aplica el regex (correcto, decisión explícita del spec 14). Login/registro/OAuth/forgot-password manejan errores inline sin exponer detalles sensibles.
  - `app/auth/callback/route.ts`: ⚠ intercambia `code` por sesión con `exchangeCodeForSession(code)` pero no verifica el `error` devuelto — si el intercambio falla, igual redirige a `/` sin sesión activa (fallo silencioso, no es una fuga de datos, pero degrada la UX y dificulta diagnosticar intentos de code-replay/expirado). Clasificado como Info por no ser explotable ni estar en el checklist de spec 13/14.
  - `app/auth/reset-password/page.tsx`: ✓ valida sesión con `getSession()` antes de mostrar el formulario, compara `password === confirmPassword`, usa `updateUser({ password })`. No reaplica `PASSWORD_REGEX` aquí — spec 13/14 no lo exigen explícitamente para este formulario (fuera del scope declarado), se marca como Info para que el equipo decida si quiere endurecerlo.
  - `app/api/contact/route.ts`: ✓ no depende de sesión (por diseño, fuera del scope de auth); usa `RESEND_API_KEY`/`CONTACT_EMAIL_TO` solo server-side, sin exposición de secretos al cliente.
  - `user_id` en scores: ✓ los 5 juegos (`arkanoid`, `asteroids`, `frogger`, `snake`, `tetris`) envían `user_id: user?.id ?? null` en el insert.
  - Higiene de secretos: ✓ sin `service_role`/`SERVICE_ROLE` en código de la app; `.gitignore` ignora `.env*` salvo `.env.template`.
- Base de datos — autorización ligada a auth (spec 14 checklist B):
  - `get_advisors(security)`: 1 hallazgo WARN — `auth_leaked_password_protection` deshabilitado (persiste desde la auditoría anterior).
  - RLS: ✓ habilitado en `public.games` y `public.scores`.
  - `public.scores`: ✓ política `authenticated_insert_own_score` (INSERT, rol `authenticated`, `WITH CHECK (auth.uid() = user_id)`) — impide que un usuario autenticado inserte scores en nombre de otro `user_id`; política `public_insert_scores` permisiva no existe.
  - `public.games`: ✓ solo SELECT público, sin políticas de escritura.
  - Función `public.rls_auto_enable()`: ✗ sigue existiendo (`SECURITY DEFINER`, event trigger function); solo `postgres`/`service_role` tienen `EXECUTE` (persiste desde la auditoría anterior, no relacionado directamente con auth pero es un criterio de aceptación de spec 14 sin cumplir).
- Hallazgos:
  - [Alto] Leaked Password Protection (HaveIBeenPwned) sigue deshabilitado en Auth Settings, según `get_advisors(security)` — afecta directamente la robustez de las contraseñas de registro/login. Recomendación: Dashboard → Authentication → Settings → Password → activar "Leaked Password Protection".
  - [Medio] `public.rls_auto_enable()` sigue sin eliminarse (repetido de la auditoría anterior). Aunque `EXECUTE` ya está revocado para `anon`/`authenticated` y es una función de event trigger (no invocable directamente por clientes), sigue siendo un criterio de aceptación explícito de spec 14 sin cumplir. Recomendación: `DROP FUNCTION IF EXISTS public.rls_auto_enable();` desde el SQL Editor del Dashboard.
  - [Info] `app/auth/callback/route.ts` no verifica el `error` de `exchangeCodeForSession(code)` antes de redirigir a `/` — un intercambio fallido (código expirado/reutilizado) deja al usuario en home sin sesión y sin mensaje de error. No es un hallazgo de spec 13/14 pero se documenta como mejora de UX/observabilidad. Recomendación: si `error`, redirigir a `/auth?error=...` en vez de `/`.
- No verificable: longitud mínima de contraseña (8) y "Max signups per hour per IP" en Auth Settings (no expuestos por `get_advisors` ni SQL); estado de "Confirm email" (double opt-in) para el proveedor Email — requieren revisión manual en Supabase Dashboard → Authentication → Settings/Providers. Credenciales OAuth de Google/GitHub (Client ID/Secret configurados) tampoco son verificables vía MCP.

## Auditoría 2026-07-20

- Rama: `spec-14-security-hardening` · Resultado global: 2 hallazgos (0 Crítico, 1 Alto, 1 Medio)
- App (checklist A, spec 14):
  - Headers HTTP (`next.config.ts`): ✓ los 4 headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-DNS-Prefetch-Control`) presentes, aplicados a `/(.*)`.
  - Validación de contraseña (`app/auth/page.tsx`): ✓ `PASSWORD_REGEX` definido correctamente (min 8, mayúscula, minúscula, dígito, símbolo), se evalúa antes de `supabase.auth.signUp` en el tab de registro, no se aplica en login (correcto según spec).
  - Proxy (`proxy.ts`): ✓ existe, `matcher: '/auth'`, redirige a `/` si ya hay sesión activa. Coherente con el alcance del spec (no se exige proteger rutas de juego).
  - `user_id` en scores: ✓ los 5 juegos con play-page (`arkanoid`, `asteroids`, `frogger`, `snake`, `tetris`) incluyen `user_id: user?.id ?? null` en el insert a `scores`.
  - Higiene de secretos: ✓ `.gitignore` ignora `.env*` salvo `.env.template`; `lib/supabase/client.ts` usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; sin ocurrencias de `service_role`/`SERVICE_ROLE` en código de la app (solo mención documental en `specs/04-supabase-integration.md`).
- Base de datos (checklist B, spec 14):
  - `get_advisors(security)`: 1 hallazgo WARN — `auth_leaked_password_protection` deshabilitado (HaveIBeenPwned no activado).
  - RLS: ✓ habilitado en `public.games` y `public.scores` (`rls_enabled: true` en ambas vía `list_tables`).
  - `public.games`: ✓ solo política `games are publicly readable` (SELECT, roles `anon, authenticated`, `USING (true)`); sin políticas INSERT/UPDATE/DELETE.
  - `public.scores`: ✓ política `scores are publicly readable` (SELECT público) + `authenticated_insert_own_score` (INSERT, rol `authenticated`, `WITH CHECK (auth.uid() = user_id)`).
  - Política permisiva `public_insert_scores`: ✓ no existe (confirmado por listado completo de `pg_policies` para ambas tablas — solo aparecen las 3 políticas esperadas).
  - Función `public.rls_auto_enable()`: ✗ **todavía existe** en el esquema `public` (confirmado vía `pg_proc`), con `SECURITY DEFINER`. El spec pide `DROP FUNCTION IF EXISTS public.rls_auto_enable()`.
- Hallazgos:
  - [Alto] Leaked Password Protection (HaveIBeenPwned) está deshabilitado en Auth Settings, según `get_advisors(security)` — contradice el criterio de aceptación del spec 14 ("Leaked Password Protection está activado"). Recomendación: en el Dashboard de Supabase, Authentication → Settings → Password, activar "Leaked Password Protection".
  - [Medio] La función `public.rls_auto_enable()` sigue presente en la base de datos (no fue eliminada como indica el spec 14, paso 1 del plan y decisión "Sí: DROP `rls_auto_enable()`"). Es un event trigger function con `SECURITY DEFINER`; no es explotable directamente por roles `anon`/`authenticated` en el estado actual, pero es superficie de ataque innecesaria y un criterio de aceptación explícito sin cumplir. Recomendación: ejecutar `DROP FUNCTION IF EXISTS public.rls_auto_enable();` desde el SQL Editor del Dashboard (fuera del alcance de este agente, que es solo lectura).
- No verificable: mínimo de longitud de contraseña (8) y "Max signups per hour per IP" en Auth Settings — no expuestos por `get_advisors` ni por SQL; requieren revisión manual en Supabase Dashboard → Authentication → Settings.

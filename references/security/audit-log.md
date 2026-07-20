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

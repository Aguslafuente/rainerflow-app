# TrainerFlow — Documento de traspaso (handoff técnico)

Todo lo necesario para continuar el proyecto en otra sesión. Última actualización: julio 2026.

---

## 1. Qué es

SaaS web de gestión integral para **personal trainers** (Uruguay / LatAm, español rioplatense).
Doble perfil: **entrenador** (administra su negocio y arma planes) y **cliente** (portal propio para ver su plan y registrar progreso).

- **App en vivo:** https://trainerflow-uy.netlify.app
- **Estado:** MVP funcional, en producción y en uso real.

---

## 2. Stack e infraestructura

- **Frontend/Backend:** Next.js 14 (App Router, React, TypeScript). Server Components + Server Actions. CSS propio (sin Tailwind), tipografía del sistema (estilo Apple).
- **Base de datos / Auth / Storage:** Supabase (Postgres + Auth email-password + Storage + Realtime).
- **Hosting:** Netlify (con `@netlify/plugin-nextjs`).
- **PWA** instalable (manifest + íconos en `/public`).

### Supabase
- Project name: **trainerflow**
- Project ref / id: **oqlyobyrllkzwxktvrme**
- Región: **sa-east-1** (São Paulo)
- Org: Aguslafuente's Org (`guyyqqswoeqffzwssvav`)
- URL: `https://oqlyobyrllkzwxktvrme.supabase.co`
- Cuenta del entrenador (dueño): `lafuenteagustin19@gmail.com`
- Cuenta de cliente de prueba: `agus10pro.2017@gmail.com` (vinculada al cliente "el pamba")
- Nota Auth: "Confirm email" está desactivado (o el flujo lo asume). Site URL y Redirect URLs configuradas a `https://trainerflow-uy.netlify.app`.

### Netlify
- Site name: **trainerflow-uy**
- Site id: **d3966752-5cf1-4b3f-91ba-aa4ff098108f**
- `netlify.toml`: `command = "npm run build"`, `publish = ".next"`, `NODE_VERSION = "20"`, plugin `@netlify/plugin-nextjs`.

### Variables de entorno (Netlify → Environment variables)
| Nombre | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key de Supabase (pública) |
| `MERCADOPAGO_ACCESS_TOKEN` | **secreto** — access token de MercadoPago (para cobros) |

> Los mismos valores públicos están en `.env.local` para correr en local. El token de MercadoPago es secreto y NO está en el repo.

---

## 3. Cómo correr y desplegar

**Local:**
```bash
cd trainerflow-app
npm install
npm run dev   # http://localhost:3000
```

**Deploy (el que se usó en esta etapa):** subida por zip a Netlify vía el MCP/CLI de Netlify (`npx @netlify/mcp@latest --site-id ... --proxy-path ...`), que sube el código y compila en la nube de Netlify.
**Recomendado a futuro:** conectar el repo a Git (GitHub) y a Netlify para deploy automático en cada push. Las env vars ya viven en Netlify.

---

## 4. Modelo de datos (Postgres / Supabase)

Todo con **Row Level Security (RLS)**. Patrón general:
- **Entrenador:** acceso a filas donde `trainer_id = auth.uid()`.
- **Cliente:** acceso vía `exists (select 1 from clients c where c.id = <tabla>.client_id and c.user_id = auth.uid())`.
- En tablas que el cliente escribe (measurements, habit_logs, checkins, reviews) un **trigger `set_trainer_from_client`** setea `trainer_id` desde el cliente (para que el inserter no lo falsee).

### Tablas
- **profiles** — `id` (=auth.users.id), `full_name`, `business_name`. Se crea sola al registrarse (trigger `handle_new_user`).
- **clients** — `trainer_id`, `full_name`, `email`, `phone`, `goal`, `status` (activo/pausa/baja), `notes`, `monthly_fee`, `currency` (UYU/USD), `billing_day`, **`user_id`** (cuenta auth del cliente si activó acceso), **`invite_token`** (uuid para el link de invitación).
- **client_intake** — 1:1 con cliente (unique client_id). ~38 campos de la ficha de presentación (personal, motivación, salud, nutrición, día típico, entrenamiento). Config en `lib/intakeFields.ts`.
- **exercises** — biblioteca. `trainer_id`, `name`, `muscle_group`, `notes`, **`video_url`**. (121 ejercicios cargados con grupo muscular.)
- **routines** — `trainer_id`, `name`, `description`.
- **routine_exercises** — `routine_id`, `name`, `sets`, `reps`, `rir`, `rest`, `weight`, `notes`, `day_label` (agrupación por día), `position`.
- **client_routines** — asignación rutina↔cliente. `client_id`, `routine_id`, `assigned_at`. unique(client_id, routine_id).
- **nutrition_plans** — 1:1 cliente. macros objetivo entreno (`target_*`) y descanso (`rest_*`): protein/fat/carbs/kcal. `notes`.
- **meals** — `plan_id`, `day_type` (entreno/descanso), `name`, `position`.
- **meal_items** — `meal_id`, `food`, `quantity`, `protein`, `fat`, `carbs`, `kcal`, `position`.
- **measurements** — progreso. `client_id`, `date`, `weight`, `cintura`, `cadera`, `pecho`, `brazo`, `muslo`, `notes`.
- **habit_logs** — checklist diario. `client_id`, `date` (unique con client_id), booleans `entrenamiento/alimentacion/hidratacion/descanso/mindset`.
- **checkins** — check-in semanal. `energia/motivacion/estres/sueno` (1-10), `logro`, `dificultad`, `foco`, `date`.
- **reviews** — revisión mensual. `period` (YYYY-MM), `satisfaccion`, `apoyo`, `cumplimiento`, `ajustes`, `alimentacion`, `comentarios`. Config en `lib/reviewFields.ts`.
- **payments** — cobros. `client_id`, `amount`, `currency`, `method` (efectivo/transferencia/mercadopago/abitab/redpagos/otro), `period`, `paid_on`, `notes`, `mp_payment_id` (unique), `mp_status`.
- **appointments** — agenda. `client_id`, `title`, `starts_at` (timestamptz, guardado/mostrado en UTC), `duration_min`, `status` (programado/completado/cancelado/ausente), `notes`.
- **messages** — chat. `trainer_id`, `client_id`, `sender_role` (trainer/client), `body`. **Realtime habilitado** (publication supabase_realtime). trainer_id lo setea trigger `set_message_trainer`.

### Funciones (RPC / triggers)
- `handle_new_user()` — trigger: crea profile al registrarse.
- `invite_info(p_token uuid)` — SECURITY DEFINER, callable por anon. Devuelve nombre del cliente + del entrenador para la página de invitación.
- `claim_client(p_token uuid)` — SECURITY DEFINER, authenticated. Vincula `clients.user_id = auth.uid()` según el token y copia el nombre del cliente al profile.
- `set_message_trainer()` / `set_trainer_from_client()` — triggers que completan `trainer_id`.
- `record_mp_payment(...)` — SECURITY DEFINER. La usa el webhook para registrar un pago aprobado de MercadoPago.

### Storage
- Bucket **`exercise-videos`** (público). Videos MP4 de ejercicios. Path por ejercicio: `<exercise_id>.mp4`. Políticas: insert/update/delete para authenticated; read público.

---

## 5. Roles y ruteo

- **Middleware** (`middleware.ts` + `lib/supabase/middleware.ts`): refresca sesión y protege rutas. Públicas: `/login`, `/auth`, `/invitacion`, `/api/mp`, `/pago-`.
- **`app/(app)/`** = área del **entrenador** (sidebar). Su layout: si el usuario está vinculado como cliente (`clients.user_id`), lo redirige a `/portal`.
- **`app/portal/`** = área del **cliente**. Su layout: si no es cliente, lo manda a `/dashboard`.
- **`/invitacion/[token]`** = alta del cliente (crea cuenta + `claim_client`). Público.
- Distinción de rol: un usuario es "cliente" si existe una fila en `clients` con `user_id = auth.uid()`; si no, es entrenador.

---

## 6. Estructura de la app (rutas principales)

```
app/
  login/                     · login + registro (entrenador)
  invitacion/[token]/        · alta del cliente por link
  pago-exito / pago-error / pago-pendiente   · resultado de pago (público)
  api/mp/checkout            · crea preferencia Checkout Pro y redirige a MP
  api/mp/webhook             · recibe aviso de MP, verifica y registra el pago
  (app)/                     · ENTRENADOR (sidebar)
    dashboard/
    clientes/  [id]/  [id]/editar  [id]/nutricion  [id]/progreso
               [id]/habitos  [id]/revisiones  [id]/chat  nuevo/
    rutinas/  [id]/  nuevo/
    ejercicios/  subir-videos/
    pagos/
    agenda/
  portal/                    · CLIENTE
    (inicio = chat)  rutina/  nutricion/  progreso/  habitos/  revision/
components/  · Logo, Sidebar, MobileHeader, MobileNav, PortalHeader, PortalNav,
               ClientTabs, ClientForm, PaymentForm, StatCard, Chat, InviteBox,
               ExerciseVideo, ConfirmSubmit, DeleteClientButton
lib/  · supabase/{client,server,middleware}, format.ts, intakeFields.ts,
        reviewFields.ts, normalize.ts
app/globals.css  · design system completo (estilo Apple)
```

Convenciones: páginas de datos son Server Components con `export const dynamic = "force-dynamic"`. Mutaciones vía Server Actions (`actions.ts` por sección). Formularios con `<form action={serverAction}>`. Componentes de video/chat/invite son `"use client"`.

---

## 7. Integración MercadoPago (Checkout Pro)

- App creada en MercadoPago Developers (Checkout Pro). Token en env `MERCADOPAGO_ACCESS_TOKEN`.
- **Cobro:** el cliente entra a su portal → "Pagar con MercadoPago" → `GET /api/mp/checkout` crea una preferencia (`items` con la cuota, `external_reference = clientId|period`, `notification_url = /api/mp/webhook`, `back_urls`) y redirige al `init_point` de MP.
- **Registro automático:** MP llama a `/api/mp/webhook` → se verifica el pago con la API de MP → si `approved`, se llama `record_mp_payment` que inserta el pago (method `mercadopago`) en la ficha del cliente. Dedupe por `mp_payment_id`.
- Probar con credenciales **de prueba** (`TEST-…`) + tarjetas de test antes de producción.
- Pendiente: **suscripciones** (débito recurrente automático) con la API de Suscripciones (mismo token).

---

## 8. Diseño / UX

- Sistema de diseño en `app/globals.css`: tipografía del sistema, fondo `#f5f5f7`, sombras difusas, radios ~18px, frosted glass en headers, botón violeta `#6c5ce7`, transiciones sutiles, skeletons de carga (`app/(app)/loading.tsx`).
- Responsive: en celular el sidebar del entrenador pasa a barra inferior de pestañas; las tablas se vuelven tarjetas.
- Marca: monograma TF (violeta + swoosh cyan), Poppins usado en materiales de marca (deck/logo) pero la app usa tipografía del sistema.

---

## 9. Pendientes / próximos pasos

1. **UX del portal del cliente (pedido):** el chat como pantalla de inicio molesta. Crear una **página de inicio (dashboard del cliente)** con resumen (su cuota/estado, próxima sesión, acceso rápido a rutina/nutrición/progreso) y mover el chat a su propia pestaña. En general: pulir el portal para que se sienta tan prolijo como el panel del entrenador y mejorar el flujo (fácil de usar).
2. **Fotos de progreso** y fotos de la revisión mensual (requiere bucket de Storage para imágenes, tipo el de videos).
3. **MercadoPago suscripciones** (cuota mensual automática).
4. **Notificaciones** (avisar al cliente de mensaje nuevo / rutina nueva; email o push).
5. **Deploy vía Git** para CI/CD.

---

## 10. Assets de marca / negocio (fuera del código)

- Plan de producto, deck comercial (horizontal + vertical), logo (SVG/PNG) y cotización — están en la carpeta de salida del proyecto.
- **Pricing:** Trainer USD 20/mes (clientes ilimitados) · Team USD 59/mes · 14 días de prueba.
- **Competencia:** Trainerize / TrueCoach / Everfit (~USD 137–200/mes, en inglés). Diferenciadores: precio, español, cobros locales (MercadoPago/Abitab/Red Pagos), WhatsApp, foco en el PT independiente.
```

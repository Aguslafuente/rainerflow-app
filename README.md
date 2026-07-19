# TrainerFlow

SaaS de gestión para personal trainers y gimnasios de Uruguay y Latinoamérica.
Incluye panel operativo para entrenadores, portal para clientes, administración de
equipos y un panel interno para operar TrainerFlow.

## Stack

- Next.js 14 con App Router, Server Components, Route Handlers y Server Actions.
- React 18 y TypeScript en modo estricto.
- Supabase para PostgreSQL, Auth, Row Level Security, Storage y Realtime.
- MercadoPago Checkout Pro y OAuth para cobros.
- Nodemailer para verificación de correo y recuperación de contraseña.
- Netlify para build y hosting.

## Funcionalidades

### Entrenadores

- Dashboard, clientes, ficha de presentación y estados de cuenta.
- Rutinas, ejercicios y videos.
- Planes de nutrición y biblioteca de alimentos.
- Progreso, hábitos, check-ins y revisiones.
- Pagos, agenda y chat en tiempo real.
- Perfil público, referidos, suscripción y conexión con MercadoPago.

### Clientes

- Inicio con cuota, próxima sesión y accesos rápidos.
- Rutina, nutrición, progreso, hábitos, revisiones y chat.
- Perfil personal y pago de cuota con MercadoPago.

### Gimnasios

- Dashboard consolidado.
- Gestión de entrenadores y clientes.
- Invitaciones por correo, branding y configuración del equipo.
- Suscripción Team.

### Administración interna

- Dashboard ejecutivo, usuarios, suscripciones, pagos y trials.
- CRM de leads, soporte, analíticas, notificaciones y buscador global.
- Autenticación independiente y consultas ejecutadas solamente del lado servidor.

## Desarrollo local

Requiere Node.js 20.

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

Copiá `.env.example` a `.env.local` y completá las variables necesarias. Nunca
incluyas `.env.local` en commits ni en ZIP de despliegue.

### Panel administrativo

El panel `/admin` requiere estas variables exclusivas del servidor:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Generá `ADMIN_SESSION_SECRET` con un valor aleatorio de al menos 32 caracteres.
No reutilices la contraseña de una cuenta personal.

### MercadoPago

Además del access token, la integración marketplace utiliza `MP_APP_ID`,
`MP_APP_SECRET` y `MP_WEBHOOK_SECRET`. La última se obtiene en la configuración
de Webhooks de la aplicación de MercadoPago.

## Base de datos

La seguridad multi-tenant depende de las políticas RLS de Supabase. Las nuevas
migraciones viven en `supabase/migrations/` y deben aplicarse al proyecto antes
de desplegar el código correspondiente.

La migración de seguridad administrativa revoca el acceso directo del navegador
a las tablas internas y a `admin_stats`; el panel accede a esos datos mediante
`/api/admin/data`, después de validar la sesión administrativa.

## Validación

```bash
npx tsc --noEmit --incremental false
npm run build
```

> Next.js 14 está fuera de soporte. El proyecto usa su último parche compatible
> como medida transitoria; la migración a una versión LTS vigente debe hacerse en
> una rama separada con pruebas de regresión.

## Estructura principal

```text
app/
  (app)/                 panel del entrenador
  (gym)/gym/             panel del gimnasio
  portal/                portal del cliente
  admin/                 administración interna
  api/auth/              registro y recuperación
  api/mp/                MercadoPago y webhooks
components/              componentes compartidos
lib/supabase/            clientes Supabase browser/server/admin
supabase/migrations/     cambios versionados de base de datos
```

## Despliegue

El proyecto está configurado para Netlify en `netlify.toml`. El flujo recomendado
es conectar el repositorio de GitHub con Netlify y desplegar desde una rama o PR,
manteniendo todas las variables secretas en el panel de Netlify.

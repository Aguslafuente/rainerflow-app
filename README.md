# TrainerFlow — MVP

Software de gestión para personal trainers. Este repo es la **fundación funcional**: autenticación, arquitectura multi-tenant (cada entrenador ve solo sus datos) y el **módulo de Clientes** de punta a punta.

Stack: **Next.js 14** (App Router) · **Supabase** (Postgres + Auth + RLS) · CSS propio con la identidad de TrainerFlow.

---

## Qué ya funciona

- Registro e inicio de sesión de entrenadores (Supabase Auth).
- Cada entrenador es un "tenant": solo ve y edita sus propios clientes (Row Level Security en la base).
- Dashboard con resumen (clientes activos, en pausa, total).
- Módulo Clientes: listar, crear, ver ficha, editar y eliminar.
- Link directo a WhatsApp desde la ficha del cliente.
- Diseño responsive con la marca (logo, paleta violeta/cyan, Poppins).

Rutinas, Pagos y Agenda están marcados como "PRONTO" — son los próximos módulos.

---

## Cómo correrlo

Necesitás **Node.js 18.17 o superior**.

```bash
cd trainerflow-app
npm install
npm run dev
```

Abrí http://localhost:3000 — te va a llevar a la pantalla de login. Registrate con un email y contraseña, y ya podés cargar clientes.

El archivo `.env.local` ya viene con las credenciales del proyecto Supabase `trainerflow`, así que no tenés que configurar nada.

---

## Importante para probar rápido (confirmación de email)

Por defecto Supabase pide confirmar el email antes de poder iniciar sesión. Para probar sin fricción durante el desarrollo:

1. Entrá al panel de Supabase → proyecto **trainerflow**.
2. **Authentication → Providers → Email**.
3. Desactivá **"Confirm email"** y guardá.

Con eso, al registrarte entrás directo. (En producción conviene dejarlo activado.)

---

## Estructura

```
app/
  layout.tsx            · fuente Poppins + estilos globales
  login/page.tsx        · login y registro
  (app)/
    layout.tsx          · shell con sidebar + guard de sesión
    dashboard/page.tsx  · resumen del negocio
    clientes/
      page.tsx          · lista de clientes
      nuevo/page.tsx     · alta
      [id]/page.tsx      · ficha
      [id]/editar/       · edición
      actions.ts         · server actions (crear/editar/borrar)
components/             · Logo, Sidebar, ClientForm, DeleteClientButton
lib/supabase/          · clientes de Supabase (browser/server/middleware)
middleware.ts          · refresco de sesión + protección de rutas
```

## Base de datos

Ya está creada en Supabase (proyecto `trainerflow`), con dos tablas:

- **profiles** — un registro por entrenador (nombre, negocio). Se crea solo al registrarse (trigger).
- **clients** — clientes de cada entrenador, con `trainer_id` y políticas RLS que garantizan aislamiento por tenant.

## Próximos pasos sugeridos

1. Módulo **Rutinas**: biblioteca de ejercicios + constructor de rutinas + asignación al cliente.
2. Módulo **Pagos**: cuotas, integración con MercadoPago, recordatorios.
3. Módulo **Agenda**: turnos y recordatorios por WhatsApp.
4. Deploy en **Vercel** (conectar el repo y pegar las mismas variables de entorno).

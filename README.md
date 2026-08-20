# Personal Finance App

App de finanzas personales — React + Vite + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + RLS), TanStack Query, Recharts.

## Setup

```bash
npm install
cp .env.example .env
```

Rellena `.env` con las credenciales de tu proyecto de Supabase:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Base de datos

Las migraciones están en `supabase/migrations/`. Para aplicarlas con la Supabase CLI:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Tipos generados

Después de aplicar las migraciones, genera los tipos de TypeScript desde el esquema real:

```bash
supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.types.ts
```

## Desarrollo

```bash
npm run dev
```

## Despliegue

Listo para Vercel: framework preset "Vite", variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en el proyecto de Vercel.

# Automec

## Database

The initial Supabase schema, tenant-scoped RLS policies, indexes, and private `checkin-photos` storage bucket are defined in `supabase/migrations/202608110001_initial_schema.sql`.

The schema smoke-test queries are in `supabase/tests/schema_indexes.sql`.

First-workshop onboarding must call the authenticated RPC `public.create_tenant_with_owner(tenant_name, tenant_document, tenant_phone)`, which creates the tenant and owner membership atomically. Direct tenant or membership inserts are not exposed to the client.

## Runtime

Use Node.js `^20.19.0 || >=22.12.0` for local development, tests, and builds. Configure the Vercel Node.js runtime to `^20.19.0 || >=22.12.0` so deployments match the supported Vite toolchain.

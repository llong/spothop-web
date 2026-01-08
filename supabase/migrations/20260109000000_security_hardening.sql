-- Create extensions schema if it doesn't exist
create schema if not exists extensions;

-- Enable RLS on spatial_ref_sys to resolve Supabase Security Linter ERROR
-- Even though this is a system table, Supabase requires RLS on all tables in public schema
alter table public.spatial_ref_sys enable row level security;

-- Grant select access to everyone for spatial_ref_sys (reference data)
drop policy if exists "Allow public read access to spatial_ref_sys" on public.spatial_ref_sys;
create policy "Allow public read access to spatial_ref_sys"
on public.spatial_ref_sys
for select
to public
using (true);

-- Move postgis extension to extensions schema to resolve Supabase Security Linter WARN
-- Note: This requires the extensions schema to be in your search_path
-- You may need to run: alter database postgres set search_path to "$user", public, extensions;
-- But typically Supabase handles this if you use the dashboard or migrations properly.
alter extension postgis set schema extensions;

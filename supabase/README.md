# Supabase

- `migrations/` - SQL migrations, one file per version, named `<version>_<name>.sql`. The files here
  match the versions recorded in the production project's `supabase_migrations.schema_migrations`.
- `functions/` - Edge Functions (`moderate-content`).
- `config.toml` - local Supabase CLI configuration.

## Writing a migration

1. Add `migrations/<UTC timestamp>_<snake_case_name>.sql`. Versions must be unique.
2. Make it idempotent where you can (`IF NOT EXISTS`, `DROP ... IF EXISTS`, `CREATE OR REPLACE`).
3. Every new table needs `ENABLE ROW LEVEL SECURITY` and explicit policies. Use `(SELECT auth.uid())`
   inside policies. Pin `SET search_path = public` on functions, and prefer `SECURITY INVOKER`.
4. Apply it so it is *recorded*: `supabase db push`, or the Supabase MCP `apply_migration` tool.
   If you run SQL in the dashboard editor instead, the history is not updated; run
   `supabase migration repair --status applied <version>` afterwards.
5. Rename the file to the version Supabase recorded if it differs (the MCP tool stamps its own).
6. Run the security and performance advisors after schema changes.

## Known limitation

The earliest schema (tables created before migration tracking) exists only as the `remote_schema`
dumps, and a few early migrations reference tables those dumps create later. Replaying
`migrations/` into an empty database is therefore not guaranteed to work. To fix that, squash into a
single baseline: `supabase db dump --linked -f supabase/migrations/<version>_baseline.sql`
(needs Docker), then mark the older versions as applied with `supabase migration repair`.

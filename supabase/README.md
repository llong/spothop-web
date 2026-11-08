# Supabase

- `migrations/` - SQL migrations, one file per version, named `<version>_<name>.sql`. The files here
  match the versions recorded in the production project's `supabase_migrations.schema_migrations`.
- `functions/` - Edge Functions (`moderate-content`, `delete-spot`, `cleanup-orphan-media`) plus `_shared/` logic.
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

## Edge Functions

Deploy with the Supabase CLI (`brew install supabase/tap/supabase`, then `supabase login` and
`supabase link --project-ref <ref>`):

```sh
supabase functions deploy delete-spot --use-api
supabase functions deploy cleanup-orphan-media --use-api
```

Functions need no extra secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
provided by the platform. The `_shared/` folder is bundled in automatically through the relative import.

### Why spot media is deleted server-side

The browser can only delete storage objects it uploaded (RLS), so a spot's creator could not remove media
other users added, and failures were silent. That left orphaned files that cost storage and bandwidth.
`delete-spot` runs with the service role after checking the caller is the creator or an admin: it removes
every file under `spots/<id>/` first and the row last, so a failure leaves the row and can be retried.
Until it is deployed, the app falls back to the old browser-side delete (which can only remove files the
current user owns).

### Cleaning up existing orphans

`cleanup-orphan-media` finds files no spot references (deleted spots, failed uploads). It is admin-only,
**dry run by default**, paged, and never touches files newer than 24 hours (uploads write the file before
the row) or folders that are not spot ids. Run it from the admin dashboard, **Storage** tab: scan, review
the counts, then confirm to delete. To run it on a schedule instead, call it with an `x-cron-secret` header
matching a `CRON_SECRET` function secret (`supabase secrets set CRON_SECRET=...`).

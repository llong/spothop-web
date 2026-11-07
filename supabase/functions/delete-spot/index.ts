// Deletes a spot AND every file stored for it, regardless of who uploaded the files.
//
// Why an Edge Function: the browser can only delete storage objects it owns (RLS), so a spot's creator
// could not remove other users' photos/videos, and any failure was silent. This runs with the service
// role after checking that the caller is the spot's creator or an admin.
//
// Order matters: files are removed first and the spot row last. If anything fails the row survives, so
// the request can simply be retried and nothing is left half-deleted.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { BUCKET, SPOTS_PREFIX, listAllFiles, removeFiles } from '../_shared/storageCleanup.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Who is calling?
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) return json({ error: 'Not authenticated' }, 401);

    const body = await req.json().catch(() => null);
    const spotId = body?.spotId;
    if (typeof spotId !== 'string' || !UUID.test(spotId)) return json({ error: 'spotId must be a UUID' }, 400);

    const admin = createClient(url, serviceKey);
    const [{ data: spot }, { data: profile }] = await Promise.all([
      admin.from('spots').select('id, created_by').eq('id', spotId).maybeSingle(),
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ]);
    const isAdmin = profile?.role === 'admin';

    if (!spot) {
      // The row is already gone; only an admin may clear leftover files (we cannot verify ownership).
      if (!isAdmin) return json({ error: 'Spot not found' }, 404);
    } else if (spot.created_by !== user.id && !isAdmin) {
      return json({ error: 'Not allowed to delete this spot' }, 403);
    }

    // 1. Files first (throws on failure, leaving the row in place so the call can be retried)
    const storage = admin.storage.from(BUCKET);
    const files = await listAllFiles(storage, `${SPOTS_PREFIX}/${spotId}`);
    const filesRemoved = await removeFiles(storage, files.map((f) => f.path));
    const bytesFreed = files.reduce((n, f) => n + f.size, 0);

    // 2. Then the row (cascades to photos, videos, comments, etc.)
    if (spot) {
      const { error } = await admin.from('spots').delete().eq('id', spotId);
      if (error) throw new Error(`Could not delete the spot row: ${error.message}`);
    }

    return json({ ok: true, filesRemoved, bytesFreed });
  } catch (error) {
    console.error('delete-spot failed:', error);
    return json({ error: 'Could not delete the spot. Please try again.' }, 500);
  }
});

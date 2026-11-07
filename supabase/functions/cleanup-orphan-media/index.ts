// Finds (and optionally deletes) files in the spot-media bucket that no spot references:
//   - files in a spots/<id>/ folder whose spot no longer exists, and
//   - files in a live spot that no photo/video row points to (older than minAgeHours, so an upload that
//     is still in flight is never touched).
//
// SAFE BY DEFAULT: dryRun is true unless the request says { "dryRun": false }.
// Authorization: an admin's JWT, or the x-cron-secret header matching the CRON_SECRET env var (for pg_cron).
// Large buckets are processed in pages: pass { "offset": <nextOffset> } from the previous response.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  BUCKET,
  SPOTS_PREFIX,
  listAllFiles,
  listFolders,
  planOrphans,
  removeFiles,
  storagePathFromUrl,
} from '../_shared/storageCleanup.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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
    const admin = createClient(url, serviceKey);

    // Authorize: cron secret, or an admin user
    const cronSecret = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('x-cron-secret');
    let authorized = !!cronSecret && !!providedSecret && providedSecret === cronSecret;
    if (!authorized) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      });
      const { data } = await userClient.auth.getUser();
      if (data?.user) {
        const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
        authorized = profile?.role === 'admin';
      }
    }
    if (!authorized) return json({ error: 'Admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false; // default: dry run
    const minAgeHours = Number.isFinite(body?.minAgeHours) ? Math.max(1, body.minAgeHours) : 24;
    const offset = Number.isInteger(body?.offset) && body.offset >= 0 ? body.offset : 0;
    const limit = Number.isInteger(body?.limit) && body.limit > 0 ? Math.min(body.limit, 200) : 100;

    const storage = admin.storage.from(BUCKET);
    const folders = (await listFolders(storage, SPOTS_PREFIX)).sort();
    const page = folders.slice(offset, offset + limit);

    // Which of these spots still exist?
    const uuidFolders = page.filter((f) => UUID.test(f));
    const live = new Set<string>();
    for (let i = 0; i < uuidFolders.length; i += 100) {
      const { data, error } = await admin.from('spots').select('id').in('id', uuidFolders.slice(i, i + 100));
      if (error) throw error;
      for (const row of data ?? []) live.add(row.id);
    }

    const now = Date.now();
    const toRemove: string[] = [];
    const report = { orphanFolders: 0, liveSpotsWithOrphans: 0, orphanFiles: 0, bytes: 0, skippedRecent: 0, skippedNonSpotFolders: 0 };

    for (const folder of page) {
      if (!UUID.test(folder)) {
        report.skippedNonSpotFolders++; // never delete things we do not understand
        continue;
      }
      const spotExists = live.has(folder);
      const files = await listAllFiles(storage, `${SPOTS_PREFIX}/${folder}`);

      const referencedPaths = new Set<string>();
      if (spotExists) {
        const [photos, videos] = await Promise.all([
          admin.from('spot_photos').select('url, thumbnail_small_url, thumbnail_large_url, thumbnailurl').eq('spot_id', folder),
          admin.from('spot_videos').select('url, thumbnail_url').eq('spot_id', folder),
        ]);
        if (photos.error) throw photos.error;
        if (videos.error) throw videos.error;
        for (const row of photos.data ?? []) {
          for (const u of [row.url, row.thumbnail_small_url, row.thumbnail_large_url, row.thumbnailurl]) {
            const p = storagePathFromUrl(u);
            if (p) referencedPaths.add(p);
          }
        }
        for (const row of videos.data ?? []) {
          for (const u of [row.url, row.thumbnail_url]) {
            const p = storagePathFromUrl(u);
            if (p) referencedPaths.add(p);
          }
        }
      }

      const plan = planOrphans({ files, spotExists, referencedPaths, now, olderThanMs: minAgeHours * 3600_000 });
      report.skippedRecent += plan.skippedRecent;
      if (plan.toRemove.length > 0) {
        if (spotExists) report.liveSpotsWithOrphans++;
        else report.orphanFolders++;
        report.orphanFiles += plan.toRemove.length;
        report.bytes += plan.toRemove.reduce((n, f) => n + f.size, 0);
        toRemove.push(...plan.toRemove.map((f) => f.path));
      }
    }

    const removed = dryRun ? 0 : await removeFiles(storage, toRemove);

    return json({
      dryRun,
      minAgeHours,
      scannedFolders: page.length,
      totalFolders: folders.length,
      nextOffset: offset + limit < folders.length ? offset + limit : null,
      ...report,
      removed,
      sample: toRemove.slice(0, 20),
    });
  } catch (error) {
    console.error('cleanup-orphan-media failed:', error);
    return json({ error: 'Cleanup failed. See the function logs.' }, 500);
  }
});

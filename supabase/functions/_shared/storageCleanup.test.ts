import { describe, it, expect } from 'vitest';
import {
  listAllFiles,
  listFolders,
  removeFiles,
  planOrphans,
  storagePathFromUrl,
  type StorageApi,
  type StorageEntry,
} from './storageCleanup';

/** In-memory storage that lists like Supabase: immediate children only, folders have id=null. */
function fakeStorage(files: Record<string, { size?: number; createdAt?: string }>, opts: { failRemove?: boolean } = {}) {
  const removed: string[] = [];
  const api: StorageApi = {
    async list(dir, options) {
      const prefix = dir.replace(/\/+$/, '') + '/';
      const children = new Map<string, StorageEntry>();
      for (const [path, meta] of Object.entries(files)) {
        if (!path.startsWith(prefix) || removed.includes(path)) continue;
        const rest = path.slice(prefix.length);
        const [head, ...tail] = rest.split('/');
        if (tail.length > 0) children.set(head, { name: head, id: null });
        else children.set(head, { name: head, id: `id-${path}`, created_at: meta.createdAt ?? null, metadata: { size: meta.size ?? 0 } });
      }
      const all = [...children.values()];
      const offset = options?.offset ?? 0;
      return { data: all.slice(offset, offset + (options?.limit ?? 100)), error: null };
    },
    async remove(paths) {
      if (opts.failRemove) return { data: null, error: { message: 'boom' } };
      removed.push(...paths);
      return { data: paths.map((name) => ({ name })), error: null };
    },
  };
  return { api, removed };
}

const SPOT = 'spots/aaaa';

describe('listAllFiles', () => {
  it('finds files at every depth, including both thumbnail layouts', async () => {
    const { api } = fakeStorage({
      [`${SPOT}/photos/originals/a.webp`]: { size: 10 },
      [`${SPOT}/photos/thumbnails/small/a.webp`]: { size: 1 },
      [`${SPOT}/photos/thumbnails/large/a.webp`]: { size: 2 },
      [`${SPOT}/photos/thumbnails/legacy_240.jpg`]: { size: 3 },
      [`${SPOT}/videos/originals/v.mp4`]: { size: 100 },
      ['spots/bbbb/photos/originals/other.webp']: {},
    });

    const files = await listAllFiles(api, SPOT);

    expect(files.map((f) => f.path).sort()).toEqual([
      `${SPOT}/photos/originals/a.webp`,
      `${SPOT}/photos/thumbnails/large/a.webp`,
      `${SPOT}/photos/thumbnails/legacy_240.jpg`,
      `${SPOT}/photos/thumbnails/small/a.webp`,
      `${SPOT}/videos/originals/v.mp4`,
    ]);
    expect(files.reduce((n, f) => n + f.size, 0)).toBe(116);
  });

  it('paginates large folders', async () => {
    const many: Record<string, object> = {};
    for (let i = 0; i < 2500; i++) many[`${SPOT}/photos/originals/f${i}.webp`] = {};
    const { api } = fakeStorage(many);
    // fakeStorage caps each page at the requested limit; listAllFiles must keep asking
    expect(await listAllFiles(api, SPOT)).toHaveLength(2500);
  });

  it('returns nothing for a folder that does not exist', async () => {
    const { api } = fakeStorage({ 'spots/bbbb/x.webp': {} });
    expect(await listAllFiles(api, 'spots/zzzz')).toEqual([]);
  });

  it('surfaces listing errors instead of treating them as empty', async () => {
    const api: StorageApi = {
      list: async () => ({ data: null, error: { message: 'denied' } }),
      remove: async () => ({ data: [], error: null }),
    };
    await expect(listAllFiles(api, SPOT)).rejects.toThrow(/denied/);
  });
});

describe('listFolders', () => {
  it('returns only sub-folder names (spot ids)', async () => {
    const { api } = fakeStorage({ 'spots/aaaa/p.webp': {}, 'spots/bbbb/q.webp': {}, 'spots/loose.txt': {} });
    expect((await listFolders(api, 'spots')).sort()).toEqual(['aaaa', 'bbbb']);
  });
});

describe('removeFiles', () => {
  it('removes in batches and reports the count', async () => {
    const paths = Array.from({ length: 250 }, (_, i) => `${SPOT}/f${i}`);
    const { api, removed } = fakeStorage(Object.fromEntries(paths.map((p) => [p, {}])));
    expect(await removeFiles(api, paths, 100)).toBe(250);
    expect(removed).toHaveLength(250);
  });

  it('throws on a failed delete so the caller does not continue', async () => {
    const { api } = fakeStorage({ [`${SPOT}/a`]: {} }, { failRemove: true });
    await expect(removeFiles(api, [`${SPOT}/a`])).rejects.toThrow(/boom/);
  });

  it('does nothing for an empty list', async () => {
    const { api, removed } = fakeStorage({});
    expect(await removeFiles(api, [])).toBe(0);
    expect(removed).toEqual([]);
  });
});

describe('storagePathFromUrl', () => {
  it('extracts the object path from a public URL', () => {
    expect(storagePathFromUrl('https://p.supabase.co/storage/v1/object/public/spot-media/spots/1/photos/a.webp')).toBe('spots/1/photos/a.webp');
  });
  it('ignores query strings and decodes escapes', () => {
    expect(storagePathFromUrl('https://p.supabase.co/storage/v1/object/public/spot-media/spots/1/a%20b.webp?t=9')).toBe('spots/1/a b.webp');
  });
  it('returns empty for other buckets, null and empty input', () => {
    expect(storagePathFromUrl('https://p.supabase.co/storage/v1/object/public/avatars/x.webp')).toBe('');
    expect(storagePathFromUrl(null)).toBe('');
    expect(storagePathFromUrl('')).toBe('');
  });
});

describe('planOrphans', () => {
  const HOUR = 3600_000;
  const now = Date.parse('2026-11-07T12:00:00Z');
  const old = '2026-11-01T00:00:00Z';
  const fresh = '2026-11-07T11:30:00Z';
  const f = (name: string, createdAt: string | null) => ({ path: `${SPOT}/${name}`, size: 1, createdAt });

  it('removes everything when the spot no longer exists, regardless of age', () => {
    const files = [f('a', fresh), f('b', old), f('c', null)];
    const plan = planOrphans({ files, spotExists: false, referencedPaths: new Set(), now, olderThanMs: 24 * HOUR });
    expect(plan.toRemove).toHaveLength(3);
  });

  it('keeps referenced files in a live spot', () => {
    const files = [f('keep', old), f('drop', old)];
    const plan = planOrphans({ files, spotExists: true, referencedPaths: new Set([`${SPOT}/keep`]), now, olderThanMs: 24 * HOUR });
    expect(plan.toRemove.map((x) => x.path)).toEqual([`${SPOT}/drop`]);
  });

  it('never removes a recent unreferenced file (it may be mid-upload)', () => {
    const plan = planOrphans({ files: [f('new', fresh)], spotExists: true, referencedPaths: new Set(), now, olderThanMs: 24 * HOUR });
    expect(plan.toRemove).toEqual([]);
    expect(plan.skippedRecent).toBe(1);
  });

  it('keeps files of unknown age in a live spot', () => {
    const plan = planOrphans({ files: [f('mystery', null)], spotExists: true, referencedPaths: new Set(), now, olderThanMs: 24 * HOUR });
    expect(plan.toRemove).toEqual([]);
    expect(plan.skippedRecent).toBe(1);
  });
});

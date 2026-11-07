/**
 * Storage cleanup logic shared by the delete-spot and cleanup-orphan-media Edge Functions.
 * Pure functions over an injected storage client so they can be unit-tested without Deno or Supabase.
 */

export const BUCKET = 'spot-media';
export const SPOTS_PREFIX = 'spots';

export interface StorageEntry {
  name: string;
  /** null for "folders" (virtual prefixes) in Supabase Storage listings */
  id: string | null;
  created_at?: string | null;
  metadata?: { size?: number } | null;
}

export interface StorageApi {
  list(
    path: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: StorageEntry[] | null; error: { message: string } | null }>;
  remove(paths: string[]): Promise<{ data: unknown; error: { message: string } | null }>;
}

export interface StoredFile {
  path: string;
  size: number;
  createdAt: string | null;
}

const PAGE = 1000;

/** Lists the immediate children of `prefix` (files and folder names). */
async function listDir(storage: StorageApi, dir: string): Promise<StorageEntry[]> {
  const all: StorageEntry[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await storage.list(dir, { limit: PAGE, offset });
    if (error) throw new Error(`Could not list "${dir}": ${error.message}`);
    const entries = data ?? [];
    all.push(...entries);
    if (entries.length < PAGE) return all;
  }
}

/** Recursively lists every file under `prefix`. */
export async function listAllFiles(storage: StorageApi, prefix: string): Promise<StoredFile[]> {
  const files: StoredFile[] = [];
  const pending = [prefix.replace(/\/+$/, '')];
  while (pending.length > 0) {
    const dir = pending.pop()!;
    for (const entry of await listDir(storage, dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.id === null) pending.push(path);
      else files.push({ path, size: entry.metadata?.size ?? 0, createdAt: entry.created_at ?? null });
    }
  }
  return files;
}

/** Names of the immediate sub-folders of `prefix` (for `spots/`, these are spot ids). */
export async function listFolders(storage: StorageApi, prefix: string): Promise<string[]> {
  return (await listDir(storage, prefix)).filter((e) => e.id === null).map((e) => e.name);
}

/** Removes files in batches. Throws on the first error so callers do not continue past a failed delete. */
export async function removeFiles(storage: StorageApi, paths: string[], batchSize = 100): Promise<number> {
  let removed = 0;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { data, error } = await storage.remove(batch);
    if (error) throw new Error(`Could not remove ${batch.length} file(s): ${error.message}`);
    removed += Array.isArray(data) ? data.length : batch.length;
  }
  return removed;
}

/** `https://x.supabase.co/storage/v1/object/public/spot-media/spots/1/a.webp?t=1` -> `spots/1/a.webp` */
export function storagePathFromUrl(url: string | null | undefined): string {
  if (!url) return '';
  const marker = `/public/${BUCKET}/`;
  const clean = url.split('?')[0];
  const i = clean.indexOf(marker);
  if (i === -1) return '';
  try {
    return decodeURIComponent(clean.slice(i + marker.length));
  } catch {
    return '';
  }
}

export interface OrphanPlan {
  toRemove: StoredFile[];
  /** Files in a live spot that are unreferenced but too new to be sure they are not mid-upload. */
  skippedRecent: number;
}

/**
 * Decides which files in a spot folder to delete.
 * - If the spot no longer exists, every file is an orphan.
 * - If the spot exists, only files no photo/video row references are orphans, and only once they are
 *   older than `olderThanMs` (uploads write the file before inserting its row, so a fresh unreferenced
 *   file may belong to an upload that is still in flight).
 */
export function planOrphans(args: {
  files: StoredFile[];
  spotExists: boolean;
  referencedPaths: Set<string>;
  now: number;
  olderThanMs: number;
}): OrphanPlan {
  const { files, spotExists, referencedPaths, now, olderThanMs } = args;
  if (!spotExists) return { toRemove: files, skippedRecent: 0 };

  const toRemove: StoredFile[] = [];
  let skippedRecent = 0;
  for (const file of files) {
    if (referencedPaths.has(file.path)) continue;
    const created = file.createdAt ? Date.parse(file.createdAt) : NaN;
    // Unknown age: keep it. Deleting the wrong file is worse than leaving one orphan for the next run.
    if (Number.isNaN(created) || now - created < olderThanMs) {
      skippedRecent++;
      continue;
    }
    toRemove.push(file);
  }
  return { toRemove, skippedRecent };
}

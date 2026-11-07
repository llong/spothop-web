import { describe, it, expect, vi, beforeEach } from 'vitest';

const del = vi.hoisted(() => vi.fn());
vi.mock('idb-keyval', () => ({ del }));

import { queryClient, clearQueryCache, PERSIST_KEY } from './queryClient';

describe('clearQueryCache', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        del.mockResolvedValue(undefined);
        queryClient.clear();
    });

    it('uses the persister default storage key', () => {
        expect(PERSIST_KEY).toBe('REACT_QUERY_OFFLINE_CACHE');
    });

    it('empties the in-memory cache and deletes the persisted copy', async () => {
        queryClient.setQueryData(['chat', 'inbox', 'user-1'], [{ id: 'private' }]);
        expect(queryClient.getQueryData(['chat', 'inbox', 'user-1'])).toBeDefined();

        await clearQueryCache();

        expect(queryClient.getQueryData(['chat', 'inbox', 'user-1'])).toBeUndefined();
        expect(del).toHaveBeenCalledWith(PERSIST_KEY);
    });

    it('still clears memory and does not throw if IndexedDB deletion fails', async () => {
        del.mockRejectedValue(new Error('IDB unavailable'));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        queryClient.setQueryData(['profile', 'u1'], { id: 'u1' });

        await expect(clearQueryCache()).resolves.toBeUndefined();

        expect(queryClient.getQueryData(['profile', 'u1'])).toBeUndefined();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});

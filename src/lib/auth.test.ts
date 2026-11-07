import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    signOut: vi.fn(),
    clearQueryCache: vi.fn(),
}));

vi.mock('@/supabase', () => ({ default: { auth: { signOut: mocks.signOut } } }));
vi.mock('@/lib/queryClient', () => ({ clearQueryCache: mocks.clearQueryCache }));

import { signOut } from './auth';

describe('signOut', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.signOut.mockResolvedValue({ error: null });
        mocks.clearQueryCache.mockResolvedValue(undefined);
    });

    it('signs out and then clears cached user data', async () => {
        const order: string[] = [];
        mocks.signOut.mockImplementation(async () => { order.push('signOut'); return { error: null }; });
        mocks.clearQueryCache.mockImplementation(async () => { order.push('clear'); });

        await signOut();

        expect(order).toEqual(['signOut', 'clear']);
    });

    it('clears cached user data even if the sign-out request fails', async () => {
        mocks.signOut.mockRejectedValue(new Error('network'));

        await expect(signOut()).rejects.toThrow('network');

        expect(mocks.clearQueryCache).toHaveBeenCalledTimes(1);
    });
});

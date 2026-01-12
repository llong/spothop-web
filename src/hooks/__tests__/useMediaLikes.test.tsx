import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaLikes } from '../useMediaLikes';
import supabase from 'src/supabase';

// Mock dependencies with actual atom export
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'user') return { user: { id: 'u1' } };
            return null;
        }),
    };
});

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ error: null })
                }))
            })),
            insert: vi.fn().mockResolvedValue({ error: null })
        }))
    }
}));

describe('useMediaLikes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('toggles like from false to true (insert)', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue({
            insert: mockInsert
        } as any);

        const { result } = renderHook(() => useMediaLikes());

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleLike('m1', 'photo', false);
        });

        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            photo_id: 'm1',
            media_type: 'photo'
        }));
        expect(toggleResult?.success).toBe(true);
    });

    it('toggles like from true to false (delete)', async () => {
        const mockDelete = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })
        });
        vi.mocked(supabase.from).mockReturnValue({
            delete: mockDelete
        } as any);

        const { result } = renderHook(() => useMediaLikes());

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleLike('v1', 'video', true);
        });

        expect(mockDelete).toHaveBeenCalled();
        expect(toggleResult?.success).toBe(true);
    });
});

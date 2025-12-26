import { renderHook, act } from '@testing-library/react';
import { useMediaLikes } from '../useMediaLikes';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';

// Mock dependencies
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ error: null })
                }))
            })),
            insert: vi.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
    };
});

describe('useMediaLikes hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'test-user-id' } });
    });

    it('submits a like successfully', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useMediaLikes());

        let res: any;
        await act(async () => {
            res = await result.current.toggleLike('media-1', 'photo', false);
        });

        expect(res?.success).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'test-user-id',
            photo_id: 'media-1',
            video_id: null,
            media_type: 'photo'
        });
    });

    it('removes a like successfully', async () => {
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });
        const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
        const mockDelete = vi.fn(() => ({ eq: mockEq1 }));
        (supabase.from as any).mockReturnValue({ delete: mockDelete });

        const { result } = renderHook(() => useMediaLikes());

        let res: any;
        await act(async () => {
            res = await result.current.toggleLike('media-1', 'video', true);
        });

        expect(res?.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('user_id', 'test-user-id');
        expect(mockEq2).toHaveBeenCalledWith('video_id', 'media-1');
    });

    it('handles API errors', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'DB Error' } });
        (supabase.from as any).mockReturnValue({ insert: mockInsert });

        const { result } = renderHook(() => useMediaLikes());

        let res: any;
        await act(async () => {
            res = await result.current.toggleLike('media-1', 'photo', false);
        });

        expect(res?.success).toBe(false);
        expect(res?.error).toBe('DB Error');
    });

    it('requires authentication', async () => {
        vi.mocked(useAtomValue).mockReturnValueOnce(null);

        const { result } = renderHook(() => useMediaLikes());

        let res: any;
        await act(async () => {
            res = await result.current.toggleLike('media-1', 'photo', false);
        });

        expect(res?.success).toBe(false);
        expect(res?.error).toBe('User not authenticated');
    });
});

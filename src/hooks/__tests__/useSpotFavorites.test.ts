import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotFavorites } from '../useSpotFavorites';
import supabase from 'src/supabase';

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn()
                }))
            })),
            insert: vi.fn()
        }))
    }
}));

describe('useSpotFavorites', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSpot = {
        id: 'spot-1',
        isFavorited: false
    };

    const userId = 'user-1';

    it('initializes with spot.isFavorited value', () => {
        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId));
        expect(result.current.isFavorited).toBe(false);

        const { result: result2 } = renderHook(() => useSpotFavorites({ ...mockSpot, isFavorited: true } as any, userId));
        expect(result2.current.isFavorited).toBe(true);
    });

    it('toggles favorite from false to true', async () => {
        const mockFrom = vi.mocked(supabase.from);
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        mockFrom.mockReturnValue({ insert: mockInsert } as any);

        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId));

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        expect(mockInsert).toHaveBeenCalledWith({ user_id: userId, spot_id: mockSpot.id });
        expect(result.current.isFavorited).toBe(true);
        expect(toggleResult?.message).toBe('Added to favorites');
    });

    it('toggles favorite from true to false', async () => {
        const mockFrom = vi.mocked(supabase.from);
        const mockDelete = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null })
            })
        });
        mockFrom.mockReturnValue({ delete: mockDelete } as any);

        const { result } = renderHook(() => useSpotFavorites({ ...mockSpot, isFavorited: true } as any, userId));

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        expect(mockDelete).toHaveBeenCalled();
        expect(result.current.isFavorited).toBe(false);
        expect(toggleResult?.message).toBe('Removed from favorites');
    });

    it('handles errors during toggle', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockImplementation(() => {
            throw new Error('Database error');
        });

        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId));

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        expect(toggleResult?.success).toBe(false);
        expect(result.current.isFavorited).toBe(false); // Should not change on error
    });
});

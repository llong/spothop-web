import { renderHook, act } from '@testing-library/react';
import useSpots from '@/hooks/useSpots';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAtom, useAtomValue } from 'jotai';



const cover = { spot_id: 1, url: 'photo1', thumbnail_small_url: 's', thumbnail_large_url: 'l', thumbnail_pin_url: 'p' };

vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn((table: string) => table === 'spot_cover_photos' ? {
            select: () => ({ in: vi.fn().mockResolvedValue({ data: [cover], error: null }) }),
        } : ({
            select: vi.fn().mockImplementation(() => ({
                gte: vi.fn().mockImplementation(() => ({
                    lte: vi.fn().mockImplementation(() => ({
                        gte: vi.fn().mockImplementation(() => ({
                            lte: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Spot 1' }], error: null })
                        }))
                    }))
                }))
            })),
            eq: vi.fn().mockReturnThis(),
            overlaps: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
        })),
    },
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtom: vi.fn(),
        useAtomValue: vi.fn(),
    };
});

describe('useSpots hook', () => {
    const mockSetSpots = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAtom as any).mockReturnValue([[], mockSetSpots]);
        (useAtomValue as any).mockReturnValue({}); // Default filters
    });

    it('fetches spots within bounds', async () => {
        const { result } = renderHook(() => useSpots());

        const mockBounds = {
            getSouth: () => 1,
            getNorth: () => 2,
            getWest: () => 3,
            getEast: () => 4,
        } as any;

        await act(async () => {
            await result.current.getSpots(mockBounds);
        });

        // Each spot carries its cover photo's urls (from the spot_cover_photos view)
        expect(mockSetSpots).toHaveBeenCalledWith([
            expect.objectContaining({ id: 1, photoUrl: 'photo1', thumbnail_small_url: 's', thumbnail_large_url: 'l', thumbnail_pin_url: 'p' }),
        ]);
        expect(result.current.isLoading).toBe(false);
    });
});

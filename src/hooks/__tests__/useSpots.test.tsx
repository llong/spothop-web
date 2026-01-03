import { renderHook, act } from '@testing-library/react';
import useSpots from '../useSpots';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAtom, useAtomValue } from 'jotai';



vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockImplementation(() => ({
                gte: vi.fn().mockImplementation(() => ({
                    lte: vi.fn().mockImplementation(() => ({
                        gte: vi.fn().mockImplementation(() => ({
                            lte: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Spot 1', spot_photos: [{ url: 'photo1' }] }], error: null })
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

        expect(mockSetSpots).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});

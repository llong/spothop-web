import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spotService } from '../spotService';
import supabase from 'src/supabase';

// Mock supabase
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(),
        rpc: vi.fn(),
    }
}));

describe('spotService Flagging Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches flag count from content_reports table', async () => {
        const mockSpotId = 'spot-123';

        // Setup mocks for the various promises in fetchSpotDetails
        const mockFrom = vi.mocked(supabase.from);

        mockFrom.mockImplementation((table: string) => {
            if (table === 'spots') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: mockSpotId, name: 'Test' }, error: null })
                } as any;
            }
            if (table === 'content_reports') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    // Return a specific count for testing
                    then: (cb: any) => Promise.resolve(cb({ count: 5, data: [], error: null }))
                } as any;
            }
            // Default mock for other tables
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ data: [], error: null }))
            } as any;
        });

        const result = await spotService.fetchSpotDetails(mockSpotId);

        expect(result?.flagCount).toBe(5);
        expect(mockFrom).toHaveBeenCalledWith('content_reports');
    });
});

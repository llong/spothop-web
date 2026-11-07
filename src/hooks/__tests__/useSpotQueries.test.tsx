import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotQuery } from '@/hooks/useSpotQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { spotService } from '@/services/spotService';

vi.mock('@/services/spotService', () => ({
    spotService: {
        fetchSpotDetails: vi.fn(),
    }
}));

describe('useSpotQueries', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('useSpotQuery fetches spot data', async () => {
        const mockSpot = { id: '1', name: 'Test Spot' };
        vi.mocked(spotService.fetchSpotDetails).mockResolvedValue(mockSpot as any);

        const { result } = renderHook(() => useSpotQuery('1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockSpot);
    });
});

import { renderHook, waitFor } from '@testing-library/react';
import { useSpotQuery } from '../useSpotQueries';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { spotService } from 'src/services/spotService';
import React from 'react';

// Mock spotService
vi.mock('src/services/spotService', () => ({
    spotService: {
        fetchSpotDetails: vi.fn(),
    }
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useSpotQueries hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it('fetches spot details correctly', async () => {
        const mockSpot = { id: 'spot1', name: 'Test Spot' };
        vi.mocked(spotService.fetchSpotDetails).mockResolvedValue(mockSpot as any);

        const { result } = renderHook(() => useSpotQuery('spot1'), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockSpot);
        expect(spotService.fetchSpotDetails).toHaveBeenCalledWith('spot1', undefined);
    });
});

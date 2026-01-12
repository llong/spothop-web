import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotAddress } from '../useSpotAddress';
import { reverseGeocode } from 'src/utils/geocoding';

vi.mock('src/utils/geocoding', () => ({
    reverseGeocode: vi.fn()
}));

describe('useSpotAddress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSpot = {
        id: '1',
        name: 'Test Spot',
        latitude: 1.23,
        longitude: 4.56,
        address: 'Initial Address',
        city: 'Initial City',
        state: 'IS',
        country: 'Initial Country'
    };

    it('returns null when no spot is provided', () => {
        const { result } = renderHook(() => useSpotAddress(undefined));
        expect(result.current.displayAddress).toBeNull();
    });

    it('prefers reverse geocoded address when available', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({
            streetNumber: '123',
            street: 'New St',
            city: 'New City',
            state: 'NS',
            country: 'New Country'
        });

        const { result } = renderHook(() => useSpotAddress(mockSpot as any));

        await waitFor(() => {
            expect(result.current.displayAddress).toBe('123 New St, New City, NS, New Country');
        });
    });

    it('falls back to spot fields if reverse geocoding provides no meaningful address', async () => {
        // Resolve with empty info
        vi.mocked(reverseGeocode).mockResolvedValue({} as any);

        const { result } = renderHook(() => useSpotAddress(mockSpot as any));

        await waitFor(() => {
            expect(result.current.displayAddress).toBe('Initial Address, Initial City, IS, Initial Country');
        });
    });

    it('sets loading state correctly', async () => {
        vi.mocked(reverseGeocode).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({}), 50)));

        const { result } = renderHook(() => useSpotAddress(mockSpot as any));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });
});

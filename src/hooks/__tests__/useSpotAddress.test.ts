import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotAddress, buildBasicAddress } from '../useSpotAddress';
import { reverseGeocode } from 'src/utils/geocoding';

vi.mock('src/utils/geocoding', () => ({
    reverseGeocode: vi.fn()
}));

describe('buildBasicAddress', () => {
    it('returns null without a spot', () => {
        expect(buildBasicAddress(undefined)).toBeNull();
    });

    it('joins street address with city, state and country', () => {
        expect(buildBasicAddress({ address: '306 Caleb Avenue', city: 'Syracuse', state: 'New York', country: 'United States' }))
            .toBe('306 Caleb Avenue, Syracuse, New York, United States');
    });

    it('does not duplicate parts already present in a full formatted address', () => {
        expect(buildBasicAddress({
            address: '4JX8+HF Petaling Jaya, Selangor, Malaysia',
            city: 'Petaling Jaya', state: 'Selangor', country: 'Malaysia'
        })).toBe('4JX8+HF Petaling Jaya, Selangor, Malaysia');
    });

    it('works without a street address', () => {
        expect(buildBasicAddress({ city: 'Syracuse', state: 'NY', country: 'USA' })).toBe('Syracuse, NY, USA');
    });

    it('falls back to Unknown Location when nothing is stored', () => {
        expect(buildBasicAddress({})).toBe('Unknown Location');
    });
});

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

    it('uses stored address fields and never calls the geocoding API', () => {
        const { result } = renderHook(() => useSpotAddress(mockSpot as any));

        expect(result.current.displayAddress).toBe('Initial Address, Initial City, IS, Initial Country');
        expect(result.current.isLoading).toBe(false);
        expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('does not geocode when coordinates are missing', () => {
        const spot = { id: '3', name: 'No Coords', city: 'Somewhere' };
        const { result } = renderHook(() => useSpotAddress(spot as any));
        expect(result.current.displayAddress).toBe('Somewhere');
        expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it('reverse geocodes only when the spot has no stored street address', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({
            streetNumber: '123', street: 'New St', city: 'New City', state: 'NS', country: 'New Country'
        });
        const spot = { id: '2', name: 'No Address', latitude: 1.23, longitude: 4.56 };

        const { result } = renderHook(() => useSpotAddress(spot as any));

        await waitFor(() => {
            expect(result.current.displayAddress).toBe('123 New St, New City, NS, New Country');
        });
        expect(reverseGeocode).toHaveBeenCalledWith(1.23, 4.56);
    });

    it('keeps the fallback text if geocoding returns nothing useful', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({} as any);
        const spot = { id: '2', name: 'No Address', latitude: 1.23, longitude: 4.56 };

        const { result } = renderHook(() => useSpotAddress(spot as any));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.displayAddress).toBe('Unknown Location');
    });

    it('sets loading state while the fallback geocode is in flight', async () => {
        vi.mocked(reverseGeocode).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({}), 50)));
        const spot = { id: '2', name: 'No Address', latitude: 1.23, longitude: 4.56 };

        const { result } = renderHook(() => useSpotAddress(spot as any));

        await waitFor(() => expect(result.current.isLoading).toBe(true));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});

import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConstructFeedFilters } from '../useConstructFeedFilters';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';

describe('useConstructFeedFilters', () => {
    const mockUserLocation = { latitude: 10, longitude: 20 };

    it('constructs basic filters', () => {
        const { result } = renderHook(() => useConstructFeedFilters(INITIAL_FEED_FILTERS, mockUserLocation, 0));
        
        expect(result.current).toEqual({
            lat: undefined,
            lng: undefined,
            maxDistKm: undefined,
            followingOnly: false,
            spotTypes: undefined,
            difficulties: undefined,
            riderTypes: undefined,
            maxRisk: undefined,
            authorId: undefined,
        });
    });

    it('constructs following only filter', () => {
        const { result } = renderHook(() => useConstructFeedFilters(INITIAL_FEED_FILTERS, mockUserLocation, 1));
        
        expect(result.current.followingOnly).toBe(true);
    });

    it('constructs location filters from user location', () => {
        const filters = { ...INITIAL_FEED_FILTERS, nearMe: true, maxDistKm: 50 };
        const { result } = renderHook(() => useConstructFeedFilters(filters, mockUserLocation, 0));
        
        expect(result.current).toEqual(expect.objectContaining({
            lat: 10,
            lng: 20,
            maxDistKm: 50,
        }));
    });

    it('constructs location filters from selected location', () => {
        const selectedLocation = { lat: 30, lng: 40, name: 'Paris' };
        const filters = { ...INITIAL_FEED_FILTERS, selectedLocation, maxDistKm: 100 };
        const { result } = renderHook(() => useConstructFeedFilters(filters, mockUserLocation, 0));
        
        expect(result.current).toEqual(expect.objectContaining({
            lat: 30,
            lng: 40,
            maxDistKm: 100,
        }));
    });

    it('constructs filters with arrays and risk', () => {
        const filters = {
            ...INITIAL_FEED_FILTERS,
            spotTypes: ['rail', 'ledge'],
            difficulties: ['advanced'],
            riderTypes: ['skateboard'],
            maxRisk: 3
        };
        const { result } = renderHook(() => useConstructFeedFilters(filters, mockUserLocation, 0));
        
        expect(result.current).toEqual(expect.objectContaining({
            spotTypes: ['rail', 'ledge'],
            difficulties: ['advanced'],
            riderTypes: ['skateboard'],
            maxRisk: 3,
        }));
    });
});

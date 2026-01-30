import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConstructFeedFilters } from '../useConstructFeedFilters';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';

describe('useConstructFeedFilters', () => {
    const userLocation = { latitude: 10, longitude: 20 };

    it('returns default filters', () => {
        const { result } = renderHook(() => useConstructFeedFilters(INITIAL_FEED_FILTERS, userLocation, 0));
        
        expect(result.current).toEqual({
            lat: undefined,
            lng: undefined,
            maxDistKm: undefined,
            followingOnly: false,
            spotTypes: undefined,
            difficulties: undefined,
            riderTypes: undefined,
            maxRisk: undefined
        });
    });

    it('includes location when nearMe is true', () => {
        const filters = { ...INITIAL_FEED_FILTERS, nearMe: true, maxDistKm: 100 };
        const { result } = renderHook(() => useConstructFeedFilters(filters, userLocation, 0));
        
        expect(result.current).toMatchObject({
            lat: 10,
            lng: 20,
            maxDistKm: 100
        });
    });

    it('sets followingOnly when activeTab is 1', () => {
        const { result } = renderHook(() => useConstructFeedFilters(INITIAL_FEED_FILTERS, userLocation, 1));
        
        expect(result.current.followingOnly).toBe(true);
    });

    it('includes arrays only when populated', () => {
        const filters = { 
            ...INITIAL_FEED_FILTERS, 
            spotTypes: ['gap'],
            difficulties: ['advanced'],
            riderTypes: ['skateboard']
        };
        const { result } = renderHook(() => useConstructFeedFilters(filters, userLocation, 0));
        
        expect(result.current.spotTypes).toEqual(['gap']);
        expect(result.current.difficulties).toEqual(['advanced']);
        expect(result.current.riderTypes).toEqual(['skateboard']);
    });

    it('includes maxRisk only when less than 5', () => {
        const filters = { ...INITIAL_FEED_FILTERS, maxRisk: 4 };
        const { result } = renderHook(() => useConstructFeedFilters(filters, userLocation, 0));
        
        expect(result.current.maxRisk).toBe(4);

        const defaultRiskFilters = { ...INITIAL_FEED_FILTERS, maxRisk: 5 };
        const { result: defaultResult } = renderHook(() => useConstructFeedFilters(defaultRiskFilters, userLocation, 0));
        
        expect(defaultResult.current.maxRisk).toBeUndefined();
    });
});
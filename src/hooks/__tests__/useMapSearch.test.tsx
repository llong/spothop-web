import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMapSearch } from '../useMapSearch';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { analytics } from 'src/lib/posthog';

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
        useSetAtom: vi.fn()
    };
});

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <a>{children}</a>,
    useNavigate: vi.fn()

}));

vi.mock('src/lib/posthog', () => ({
    analytics: {
        capture: vi.fn()
    }
}));

describe('useMapSearch', () => {
    const mockMap = {
        flyTo: vi.fn(),
        once: vi.fn(),
        getBounds: vi.fn()
    };
    const mockGetSpots = vi.fn();
    const mockSetSearchedLocation = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useAtomValue as any).mockImplementation((atom: any) => {
            if (atom.debugLabel === 'map') return mockMap;
            if (atom.debugLabel === 'getSpots') return mockGetSpots;
            return null;
        });
        
        (useSetAtom as any).mockReturnValue(mockSetSearchedLocation);
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    it('should clear searched location', () => {
        const { result } = renderHook(() => useMapSearch());
        
        act(() => {
            result.current.clearSearchedLocation();
        });
        
        expect(mockSetSearchedLocation).toHaveBeenCalledWith(null);
    });

    it('should handle specific place selection', () => {
        const { result } = renderHook(() => useMapSearch());
        
        const mockPlace = {
            geometry: {
                location: {
                    lat: () => 40.7128,
                    lng: () => -74.0060
                }
            },
            types: ['street_address'],
            name: 'Specific Place'
        };
        
        act(() => {
            result.current.handlePlaceSelect(mockPlace as any);
        });
        
        expect(mockMap.flyTo).toHaveBeenCalledWith([40.7128, -74.0060], 17, { duration: 1.5 });
        expect(mockMap.once).toHaveBeenCalledWith('moveend', expect.any(Function));
        
        // Trigger the once callback to check if getSpots is called
        const onceCallback = mockMap.once.mock.calls[0][1];
        mockMap.getBounds.mockReturnValueOnce('mockBounds');
        onceCallback();
        expect(mockGetSpots).toHaveBeenCalledWith('mockBounds');
        
        expect(mockSetSearchedLocation).toHaveBeenCalledWith({
            lat: 40.7128,
            lng: -74.0060,
            name: 'Specific Place'
        });
        
        expect(mockNavigate).toHaveBeenCalledWith({
            to: '/spots',
            search: { lat: 40.7128, lng: -74.0060 }
        });
        
        expect(analytics.capture).toHaveBeenCalledWith('search_performed', {
            query: 'Specific Place',
            latitude: 40.7128,
            longitude: -74.0060,
            place_types: ['street_address'],
            is_broad_location: false
        });
    });

    it('should handle broad place selection', () => {
        const { result } = renderHook(() => useMapSearch());
        
        const mockPlace = {
            geometry: {
                location: {
                    lat: () => 51.5074,
                    lng: () => -0.1278
                }
            },
            types: ['locality'], // Broad type
            formatted_address: 'London, UK'
        };
        
        act(() => {
            result.current.handlePlaceSelect(mockPlace as any);
        });
        
        expect(mockMap.flyTo).toHaveBeenCalledWith([51.5074, -0.1278], 13, { duration: 1.5 });
        expect(mockSetSearchedLocation).toHaveBeenCalledWith(null);
        
        expect(analytics.capture).toHaveBeenCalledWith('search_performed', {
            query: 'London, UK',
            latitude: 51.5074,
            longitude: -0.1278,
            place_types: ['locality'],
            is_broad_location: true
        });
    });

    it('should handle mid-level place selection', () => {
        const { result } = renderHook(() => useMapSearch());
        
        const mockPlace = {
            geometry: {
                location: {
                    lat: () => 48.8566,
                    lng: () => 2.3522
                }
            },
            types: ['neighborhood'], // Mid type
            name: 'Le Marais'
        };
        
        act(() => {
            result.current.handlePlaceSelect(mockPlace as any);
        });
        
        expect(mockMap.flyTo).toHaveBeenCalledWith([48.8566, 2.3522], 15, { duration: 1.5 });
        expect(mockSetSearchedLocation).toHaveBeenCalledWith({
            lat: 48.8566,
            lng: 2.3522,
            name: 'Le Marais'
        });
        
        expect(analytics.capture).toHaveBeenCalledWith('search_performed', expect.objectContaining({
            is_broad_location: false
        }));
    });

    it('should not do anything if lat or lng is missing', () => {
        const { result } = renderHook(() => useMapSearch());
        
        const mockPlace = {
            geometry: {
                location: {
                    lat: () => undefined,
                    lng: () => undefined
                }
            }
        };
        
        act(() => {
            result.current.handlePlaceSelect(mockPlace as any);
        });
        
        expect(mockMap.flyTo).not.toHaveBeenCalled();
        expect(mockSetSearchedLocation).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(analytics.capture).not.toHaveBeenCalled();
    });
});

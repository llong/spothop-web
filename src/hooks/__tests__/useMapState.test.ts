import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMapState } from '../useMapState';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import { useSetAtom } from 'jotai';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        atom: actual.atom,
        useSetAtom: vi.fn(),
    };
});

describe('useMapState', () => {
    let mockMap: any;
    let mockGetSpots: any;
    let mockSetGlobalUserLocation: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockMap = {
            getBounds: vi.fn().mockReturnValue({ getNorth: () => 0 }),
            getZoom: vi.fn().mockReturnValue(15),
            on: vi.fn(),
            off: vi.fn(),
            getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
            panTo: vi.fn(),
        };
        mockGetSpots = vi.fn();
        mockSetGlobalUserLocation = vi.fn();
        vi.mocked(useSetAtom).mockReturnValue(mockSetGlobalUserLocation);

        // Mock navigator.geolocation
        const mockGeolocation = {
            watchPosition: vi.fn().mockReturnValue(123),
            clearWatch: vi.fn()
        };
        Object.defineProperty(window.navigator, 'geolocation', {
            value: mockGeolocation,
            writable: true,
            configurable: true
        });
    });

    it('initializes and fetches spots', () => {
        renderHook(() => useMapState(mockMap as LeafletMap, mockGetSpots));
        expect(mockGetSpots).toHaveBeenCalled();
        expect(mockMap.on).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('handles move correctly', () => {
        const { result } = renderHook(() => useMapState(mockMap as LeafletMap, mockGetSpots));
        
        act(() => {
            result.current.handleMove();
        });

        expect(result.current.moved).toBe(true);
        expect(result.current.isFollowingUser).toBe(false);
    });

    it('updates circle size on zoom', () => {
        let zoomHandler: any;
        mockMap.on.mockImplementation((event: string, handler: any) => {
            if (event === 'zoomend') zoomHandler = handler;
        });

        const { result } = renderHook(() => useMapState(mockMap as LeafletMap, mockGetSpots));
        
        mockMap.getZoom.mockReturnValue(10);
        act(() => {
            zoomHandler();
        });

        expect(result.current.circleSize).toBe(35); // Max size for low zoom
    });

    it('watches user position and pans map', () => {
        let watchSuccess: any;
        vi.mocked(navigator.geolocation.watchPosition).mockImplementation((success) => {
            watchSuccess = success;
            return 123;
        });

        // Mock distanceTo
        const mockDistanceTo = vi.fn().mockReturnValue(100); // > 50 meters
        vi.spyOn(L, 'latLng').mockReturnValue({ distanceTo: mockDistanceTo } as any);

        renderHook(() => useMapState(mockMap as LeafletMap, mockGetSpots));

        const mockPosition = {
            coords: {
                latitude: 1.0,
                longitude: 1.0,
                accuracy: 10
            }
        };

        act(() => {
            watchSuccess(mockPosition);
        });

        expect(mockMap.panTo).toHaveBeenCalledWith([1.0, 1.0]);
        expect(mockSetGlobalUserLocation).toHaveBeenCalledWith({ latitude: 1.0, longitude: 1.0 });
    });
});
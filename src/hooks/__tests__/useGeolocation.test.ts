import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGeolocation } from '../useGeolocation';
import type { Map as LeafletMap } from 'leaflet';

describe('useGeolocation', () => {
    let mockMap: Partial<LeafletMap>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockMap = {
            flyTo: vi.fn(),
            setView: vi.fn()
        };

        // Mock navigator.geolocation
        const mockGeolocation = {
            getCurrentPosition: vi.fn()
        };
        Object.defineProperty(window.navigator, 'geolocation', {
            value: mockGeolocation,
            writable: true,
            configurable: true
        });
    });

    it('successfully gets current position', async () => {
        const mockPosition = {
            coords: {
                latitude: 10.0,
                longitude: 20.0
            }
        };

        vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
            (success as Function)(mockPosition);
        });

        const { result } = renderHook(() => useGeolocation(mockMap as LeafletMap));

        let position;
        await act(async () => {
            position = await result.current.getCurrentPosition();
        });

        expect(position).toEqual({ latitude: 10.0, longitude: 20.0 });
        expect(result.current.locating).toBe(false);
    });

    it('handles geolocation errors', async () => {
        const mockError = {
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3
        };

        vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((_, error) => {
            (error as Function)(mockError);
        });

        const { result } = renderHook(() => useGeolocation(mockMap as LeafletMap));

        await act(async () => {
            try {
                await result.current.getCurrentPosition();
            } catch (err) {
                expect(err).toEqual(mockError);
            }
        });

        expect(result.current.locating).toBe(false);
    });

    it('centers map on user position', async () => {
        const mockPosition = {
            coords: {
                latitude: 5.0,
                longitude: 15.0
            }
        };

        vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
            (success as Function)(mockPosition);
        });

        const { result } = renderHook(() => useGeolocation(mockMap as LeafletMap));

        await act(async () => {
            await result.current.centerMapOnUser();
        });

        expect(mockMap.flyTo).toHaveBeenCalledWith([5.0, 15.0], 12, { duration: 1 });
    });
});

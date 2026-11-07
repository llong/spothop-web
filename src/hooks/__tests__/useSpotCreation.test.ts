import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotCreation } from '../useSpotCreation';
import L from 'leaflet';
import { reverseGeocode } from 'src/utils/geocoding';

vi.mock('src/utils/geocoding', () => ({
    reverseGeocode: vi.fn()
}));

describe('useSpotCreation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets new spot with geocoded address on right click', async () => {
        const mockLatlng = L.latLng(10, 20);
        const mockAddress = '123 Test St';
        
        vi.mocked(reverseGeocode).mockResolvedValue({ formattedAddress: mockAddress });

        const { result } = renderHook(() => useSpotCreation(true));

        await act(async () => {
            await result.current.onRightClick(mockLatlng);
        });

        expect(reverseGeocode).toHaveBeenCalledWith(10, 20);
        expect(result.current.newSpot).toEqual({ latlng: mockLatlng, address: mockAddress });
    });

    it('does not set a spot when geocoding returns no address', async () => {
        vi.mocked(reverseGeocode).mockResolvedValue({});

        const { result } = renderHook(() => useSpotCreation(true));

        await act(async () => {
            await result.current.onRightClick(L.latLng(10, 20));
        });

        expect(result.current.newSpot).toBeNull();
    });

    it('does nothing if not logged in', async () => {
        const { result } = renderHook(() => useSpotCreation(false));

        await act(async () => {
            await result.current.onRightClick(L.latLng(10, 20));
        });

        expect(result.current.newSpot).toBeNull();
        expect(reverseGeocode).not.toHaveBeenCalled();
    });
});

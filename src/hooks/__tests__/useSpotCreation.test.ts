import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpotCreation } from '../useSpotCreation';
import L from 'leaflet';

describe('useSpotCreation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('sets new spot with geocoded address on right click', async () => {
        const mockLatlng = L.latLng(10, 20);
        const mockAddress = '123 Test St';
        
        vi.mocked(fetch).mockResolvedValue({
            json: () => Promise.resolve({
                results: [{ formatted_address: mockAddress }]
            })
        } as any);

        const { result } = renderHook(() => useSpotCreation(true));

        await act(async () => {
            await result.current.onRightClick(mockLatlng);
        });

        expect(result.current.newSpot).toEqual({ latlng: mockLatlng, address: mockAddress });
    });

    it('does nothing if not logged in', async () => {
        const { result } = renderHook(() => useSpotCreation(false));

        await act(async () => {
            await result.current.onRightClick(L.latLng(10, 20));
        });

        expect(result.current.newSpot).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });
});

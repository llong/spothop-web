import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeedFilters } from '../useFeedFilters';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';

vi.mock('src/hooks/useGeolocation', () => ({
    useGeolocation: () => ({
        centerMapOnUser: vi.fn().mockResolvedValue({ latitude: 10, longitude: 20 })
    })
}));

describe('useFeedFilters', () => {
    const onApply = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with initial filters', () => {
        const { result } = renderHook(() => useFeedFilters(INITIAL_FEED_FILTERS, onApply));
        expect(result.current.tempFilters).toEqual(INITIAL_FEED_FILTERS);
    });

    it('toggles array items correctly', () => {
        const { result } = renderHook(() => useFeedFilters(INITIAL_FEED_FILTERS, onApply));
        
        act(() => {
            result.current.toggleArrayItem('riderTypes', 'inline');
        });
        expect(result.current.tempFilters.riderTypes).toContain('inline');

        act(() => {
            result.current.toggleArrayItem('riderTypes', 'inline');
        });
        expect(result.current.tempFilters.riderTypes).not.toContain('inline');
    });

    it('handles near me change', async () => {
        const { result } = renderHook(() => useFeedFilters(INITIAL_FEED_FILTERS, onApply));
        
        await act(async () => {
            await result.current.handleNearMeChange(true);
        });
        expect(result.current.tempFilters.nearMe).toBe(true);

        await act(async () => {
            await result.current.handleNearMeChange(false);
        });
        expect(result.current.tempFilters.nearMe).toBe(false);
    });

    it('handles reset', () => {
        const { result } = renderHook(() => useFeedFilters({ ...INITIAL_FEED_FILTERS, nearMe: true }, onApply));
        
        act(() => {
            result.current.handleReset();
        });
        expect(result.current.tempFilters).toEqual(INITIAL_FEED_FILTERS);
        expect(onApply).toHaveBeenCalledWith(INITIAL_FEED_FILTERS);
    });

    it('handles apply', () => {
        const { result } = renderHook(() => useFeedFilters(INITIAL_FEED_FILTERS, onApply));
        
        act(() => {
            result.current.handleApply();
        });
        expect(onApply).toHaveBeenCalledWith(INITIAL_FEED_FILTERS);
    });
});

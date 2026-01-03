import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';
import { describe, it, expect } from 'vitest';

describe('useOnlineStatus hook', () => {
    it('initializes with current navigator.onLine value', () => {
        const { result } = renderHook(() => useOnlineStatus());
        expect(typeof result.current).toBe('boolean');
    });

    it('updates status when online/offline events fire', () => {
        const { result } = renderHook(() => useOnlineStatus());

        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(result.current).toBe(false);

        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(result.current).toBe(true);
    });
});

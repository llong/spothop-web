import { renderHook } from '@testing-library/react';
import { useDevtools } from '../useDevTools';
import { vi, describe, it, expect } from 'vitest';
import { useAtomDevtools } from 'jotai-devtools';

vi.mock('jotai-devtools', () => ({
    useAtomDevtools: vi.fn(),
}));

describe('useDevtools hook', () => {
    it('calls useAtomDevtools with correct parameters', () => {
        renderHook(() => useDevtools());
        expect(useAtomDevtools).toHaveBeenCalledWith(expect.anything(), { name: 'user' });
    });
});

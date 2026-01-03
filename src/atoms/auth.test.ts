import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { userAtom, isLoggedInAtom } from './auth';

describe('auth atoms', () => {
    it('isLoggedInAtom correctly reflects auth state', () => {
        const store = createStore();

        // Initial state
        expect(store.get(isLoggedInAtom)).toBe(false);

        // Set user
        store.set(userAtom, { user: { id: '1' } as any, session: {} as any });
        expect(store.get(isLoggedInAtom)).toBe(true);

        // Logout
        store.set(userAtom, null);
        expect(store.get(isLoggedInAtom)).toBe(false);
    });
});

import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { mapAtom, viewAtom } from './map';

describe('map atoms', () => {
    it('viewAtom defaults to map and can be updated', () => {
        const store = createStore();
        expect(store.get(viewAtom)).toBe('map');

        store.set(viewAtom, 'list');
        expect(store.get(viewAtom)).toBe('list');
    });

    it('mapAtom initializes as null', () => {
        const store = createStore();
        expect(store.get(mapAtom)).toBeNull();
    });
});

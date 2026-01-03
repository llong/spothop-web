import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { spotsAtom, filtersAtom, isFiltersOpenAtom } from './spots';

describe('spots atoms', () => {
    it('spotsAtom initializes as empty array', () => {
        const store = createStore();
        expect(store.get(spotsAtom)).toEqual([]);
    });

    it('filtersAtom can store filter values', () => {
        const store = createStore();
        store.set(filtersAtom, { difficulty: 'advanced' });
        expect(store.get(filtersAtom)).toEqual({ difficulty: 'advanced' });
    });

    it('isFiltersOpenAtom toggles visibility', () => {
        const store = createStore();
        expect(store.get(isFiltersOpenAtom)).toBe(false);
        store.set(isFiltersOpenAtom, true);
        expect(store.get(isFiltersOpenAtom)).toBe(true);
    });
});

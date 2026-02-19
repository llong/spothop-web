import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { rightSidebarAtom } from './ui';

describe('ui atoms', () => {
    it('rightSidebarAtom initializes as null', () => {
        const store = createStore();
        expect(store.get(rightSidebarAtom)).toBeNull();
    });

    it('rightSidebarAtom can store content', () => {
        const store = createStore();
        store.set(rightSidebarAtom, 'test content');
        expect(store.get(rightSidebarAtom)).toBe('test content');
    });
});

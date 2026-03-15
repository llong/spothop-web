import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ReactNode } from 'react';

export const rightSidebarAtom = atom<ReactNode | null>(null);
export const themeModeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme-mode', 'system');

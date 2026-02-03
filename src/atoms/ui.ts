import { atom } from 'jotai';
import type { ReactNode } from 'react';

export const rightSidebarAtom = atom<ReactNode | null>(null);

import { atom } from 'jotai';

export interface PWAUpdateState {
    needRefresh: boolean;
    updateFunction: (reloadPage?: boolean) => Promise<void>;
}

export const pwaUpdateAtom = atom<PWAUpdateState>({
    needRefresh: false,
    updateFunction: async () => {},
});

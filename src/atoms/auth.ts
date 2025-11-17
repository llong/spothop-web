import { atom } from 'jotai'
import type { Session, User, WeakPassword } from '@supabase/supabase-js'

type Auth = {
    user: User;
    session: Session;
    weakPassword?: WeakPassword;
}

export const userAtom = atom<Auth | null>(null)
userAtom.debugLabel = 'user';
export const isLoggedInAtom = atom((get) => get(userAtom) !== null)

import { atomWithStorage, createJSONStorage } from 'jotai/utils';

/**
 * A Jotai atom that persists its value to localStorage.
 * This is a simple wrapper around atomWithStorage using the default JSON storage.
 */
export const atomWithAsyncStorage = <T>(key: string, initialValue: T) =>
  atomWithStorage<T>(key, initialValue, createJSONStorage(() => localStorage));
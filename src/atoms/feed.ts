import { atomWithStorage } from 'jotai/utils';
import type { FeedItem } from '../types';

export const feedPersistenceAtom = atomWithStorage<FeedItem[]>('feed_persistence', []);

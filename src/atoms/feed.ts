import { atomWithStorage } from 'jotai/utils';
import type { FeedItem } from '../types';

export const feedPersistenceAtom = atomWithStorage<FeedItem[]>('feed_persistence', []);

export interface FeedFilters {
    nearMe: boolean;
    maxDistKm: number;
    spotTypes: string[];
    difficulties: string[];
    riderTypes: string[];
    maxRisk: number;
    author?: { id: string, username: string, displayName: string, avatarUrl?: string | null };
    selectedLocation?: { lat: number, lng: number, name: string };
}

export const INITIAL_FEED_FILTERS: FeedFilters = {
    nearMe: false,
    maxDistKm: 50,
    spotTypes: [],
    difficulties: [],
    riderTypes: [],
    maxRisk: 5,
    author: undefined,
    selectedLocation: undefined,
};

export const feedFiltersAtom = atomWithStorage<FeedFilters>('feed_filters', INITIAL_FEED_FILTERS);
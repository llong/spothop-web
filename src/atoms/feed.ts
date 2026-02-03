import { atomWithStorage } from 'jotai/utils';

export interface FeedFilters {
    nearMe: boolean;
    maxDistKm: number;
    spotTypes: string[];
    difficulties: string[];
    riderTypes: string[];
    maxRisk: number;
}

export const INITIAL_FEED_FILTERS: FeedFilters = {
    nearMe: false,
    maxDistKm: 50,
    spotTypes: [],
    difficulties: [],
    riderTypes: [],
    maxRisk: 5,
};

export const feedFiltersAtom = atomWithStorage<FeedFilters>(
    'feedFilters',
    INITIAL_FEED_FILTERS
);
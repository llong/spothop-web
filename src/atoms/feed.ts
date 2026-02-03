import { atomWithAsyncStorage } from "src/utils/cache";

export interface FeedFilters {
    nearMe: boolean;
    maxDistKm: number;
    spotTypes: string[];
    difficulties: string[];
    riderTypes: string[];
    maxRisk: number;
    selectedLocation?: {
        lat: number;
        lng: number;
        name: string;
    };
    author?: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl?: string | null;
    };
}

export const INITIAL_FEED_FILTERS: FeedFilters = {
    nearMe: false,
    maxDistKm: 50,
    spotTypes: [],
    difficulties: [],
    riderTypes: [],
    maxRisk: 5,
};

export const feedFiltersAtom = atomWithAsyncStorage<FeedFilters>(
    'feedFilters',
    INITIAL_FEED_FILTERS
);

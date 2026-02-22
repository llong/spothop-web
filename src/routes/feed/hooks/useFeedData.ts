import { useFeedQuery, useFollowingFeedQuery } from 'src/hooks/useFeedQueries';
import { useConstructFeedFilters } from 'src/hooks/useConstructFeedFilters';
import { useInfiniteScroll } from './useInfiniteScroll';

export function useGlobalFeed(userId: string | undefined, filters: any, userLocation: any) {
    const queryFilters = useConstructFeedFilters(filters, userLocation, 0);
    const query = useFeedQuery(userId, 10, queryFilters);
    const { lastElementRef } = useInfiniteScroll(query.isLoading, query.hasNextPage, query.fetchNextPage);
    const allItems = query.data?.pages.flat() || [];

    return { ...query, allItems, lastElementRef };
}

export function useFollowingFeed(userId: string | undefined) {
    const query = useFollowingFeedQuery(userId, 10);
    const { lastElementRef } = useInfiniteScroll(query.isLoading, query.hasNextPage, query.fetchNextPage);
    const allItems = query.data?.pages.flat() || [];

    return { ...query, allItems, lastElementRef };
}

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feedService';

export const feedKeys = {
    all: ['feed'] as const,
    global: () => [...feedKeys.all, 'global'] as const,
    comments: (mediaId: string) => [...feedKeys.all, 'comments', mediaId] as const,
};

/**
 * Hook for fetching paginated global feed content.
 */
export function useFeedQuery(userId?: string, limit: number = 10) {
    return useInfiniteQuery({
        queryKey: feedKeys.global(),
        queryFn: ({ pageParam = 0 }) => feedService.fetchGlobalFeed(limit, pageParam, userId),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined;
        },
        initialPageParam: 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook for toggling like on media.
 */
export function useToggleMediaLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaId, mediaType }: { mediaId: string; mediaType: 'photo' | 'video' }) =>
            feedService.toggleMediaLike(mediaId, mediaType),
        onSuccess: () => {
            // Invalidate feed to show updated like counts/status
            queryClient.invalidateQueries({ queryKey: feedKeys.all });
        },
    });
}

/**
 * Hook for fetching comments for a specific media item.
 */
export function useMediaComments(mediaId: string, mediaType: 'photo' | 'video') {
    return useQuery({
        queryKey: feedKeys.comments(mediaId),
        queryFn: () => feedService.fetchMediaComments(mediaId, mediaType),
        enabled: !!mediaId,
    });
}

/**
 * Hook for posting a comment on media.
 */
export function usePostMediaComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, mediaId, mediaType, content }: { userId: string; mediaId: string; mediaType: 'photo' | 'video', content: string }) =>
            feedService.postMediaComment(userId, mediaId, mediaType, content),
        onSuccess: (_, variables) => {
            // Invalidate comments for this media and the feed (for comment count)
            queryClient.invalidateQueries({ queryKey: feedKeys.comments(variables.mediaId) });
            queryClient.invalidateQueries({ queryKey: feedKeys.global() });
        },
    });
}

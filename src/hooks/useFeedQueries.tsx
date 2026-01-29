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
export function useFeedQuery(
    userId?: string, 
    limit: number = 10,
    filters?: { 
        lat?: number; 
        lng?: number; 
        maxDistKm?: number; 
        followingOnly?: boolean;
        spotTypes?: string[];
        difficulties?: string[];
        minRisk?: number;
        maxRisk?: number;
        riderTypes?: string[];
    }
) {
    const query = useInfiniteQuery({
        queryKey: [...feedKeys.global(), filters],
        queryFn: ({ pageParam = 0 }) => feedService.fetchGlobalFeed(limit, pageParam, userId, filters),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined;
        },
        initialPageParam: 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return query;
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
 * Hook for toggling follow status for a user.
 */
export function useToggleFollow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (followingId: string) => feedService.toggleFollow(followingId),
        onSuccess: () => {
            // Invalidate feed to show updated follow status across all items from this uploader
            queryClient.invalidateQueries({ queryKey: feedKeys.all });
        },
    });
}

/**
 * Hook for fetching comments for a specific media item.
 */
export function useMediaComments(mediaId: string, mediaType: 'photo' | 'video', userId?: string) {
    return useQuery({
        queryKey: [...feedKeys.comments(mediaId), userId],
        queryFn: () => feedService.fetchMediaComments(mediaId, mediaType, userId),
        enabled: !!mediaId,
    });
}

/**
 * Hook for toggling a reaction on a comment.
 */
export function useToggleCommentReaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, reactionType }: { commentId: string; reactionType?: string }) =>
            feedService.toggleCommentReaction(commentId, reactionType),
        onSuccess: () => {
            // Invalidate comments for all media to ensure UI consistency
            queryClient.invalidateQueries({ queryKey: ['feed', 'comments'] });
        },
    });
}

/**
 * Hook for posting a comment on media.
 */
export function usePostMediaComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaId, mediaType, content, parentId }: { mediaId: string; mediaType: 'photo' | 'video', content: string, parentId?: string }) =>
            feedService.postMediaComment(mediaId, mediaType, content, parentId),
        onSuccess: (_, { mediaId }) => {
            // Invalidate comments for this media and the feed (for comment count)
            queryClient.invalidateQueries({ queryKey: feedKeys.comments(mediaId) });
            queryClient.invalidateQueries({ queryKey: feedKeys.global() });
        },
    });
}
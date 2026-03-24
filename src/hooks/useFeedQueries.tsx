import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import { useSetAtom } from 'jotai';
import { globalToastAtom } from './useNotifications';
import { spotKeys } from './useSpotQueries'; // Moved import to top

export const feedKeys = {
    all: ['feed'] as const,
    global: () => [...feedKeys.all, 'global', 'v3'] as const,
    following: () => [...feedKeys.all, 'following', 'v3'] as const,
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
    },
    options?: { enabled?: boolean }
) {
    const query = useInfiniteQuery({
        queryKey: [...feedKeys.global(), userId, JSON.stringify(filters)], 
        queryFn: ({ pageParam = null }) => {
            console.log('[useFeedQuery] Fetching feed. User:', userId, 'Cursor:', pageParam);
            return feedService.fetchGlobalFeed(limit, pageParam as string | null, userId, filters);
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.length < limit) return undefined;
            // Use the created_at of the last item as the cursor for the next page
            return lastPage[lastPage.length - 1].created_at;
        },
        initialPageParam: null as string | null,
        staleTime: 1000 * 60 * 5, 
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        enabled: options?.enabled,
    });

    return query;
}

/**
 * Hook for fetching paginated following feed content.
 */
export function useFollowingFeedQuery(userId: string | undefined, limit: number = 10) {
    return useInfiniteQuery({
        queryKey: [...feedKeys.following(), userId],
        queryFn: ({ pageParam = 0 }) => {
            console.log('[useFollowingFeedQuery] Fetching. User:', userId);
            if (!userId) return Promise.resolve([]); 
            return feedService.fetchFollowingFeed(limit, pageParam, userId);
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined;
        },
        initialPageParam: 0,
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 mins
        refetchOnMount: true,
    });
}

/**
 * Hook for toggling like on media.
 */
export function useToggleMediaLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaId }: { mediaId: string; mediaType: 'photo' | 'video' }) =>
            feedService.toggleMediaLike(mediaId),
        onMutate: async ({ mediaId }) => {
            await queryClient.cancelQueries({ queryKey: feedKeys.all });
            const previousFeeds = queryClient.getQueriesData({ queryKey: feedKeys.all });

            queryClient.setQueriesData({ queryKey: feedKeys.all }, (oldData: any) => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any[]) => 
                        page.map((item) => 
                            item.media_id === mediaId 
                                ? { 
                                    ...item, 
                                    is_liked_by_user: !item.is_liked_by_user,
                                    like_count: item.like_count + (item.is_liked_by_user ? -1 : 1)
                                  } 
                                : item
                        )
                    )
                };
            });

            return { previousFeeds };
        },
        onSuccess: (data, { mediaId }) => {
            // Confirm the server state
            if (data) {
                queryClient.setQueriesData({ queryKey: feedKeys.all }, (oldData: any) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any[]) => 
                            page.map((item) => 
                                item.media_id === mediaId 
                                    ? { 
                                        ...item, 
                                        is_liked_by_user: data.new_is_liked,
                                        like_count: data.new_like_count
                                      } 
                                    : item
                            )
                        )
                    };
                });
            }
        },
        onError: (_err, _vars, context) => {
            if (context?.previousFeeds) {
                context.previousFeeds.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        }
    });
}

/**
 * Hook for toggling follow status for a user.
 */
export function useToggleFollow() {
    const queryClient = useQueryClient();
    const setToast = useSetAtom(globalToastAtom);

    return useMutation({
        mutationFn: (followingId: string) => feedService.toggleFollow(followingId),
        onMutate: async (followingId) => {
            await queryClient.cancelQueries({ queryKey: feedKeys.all });
            const previousFeeds = queryClient.getQueriesData({ queryKey: feedKeys.all });

            queryClient.setQueriesData({ queryKey: feedKeys.all }, (oldData: any) => {
                if (!oldData?.pages) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any[]) => 
                        page.map((item) => 
                            item.uploader_id === followingId 
                                ? { ...item, is_followed_by_user: !item.is_followed_by_user } 
                                : item
                        )
                    )
                };
            });

            return { previousFeeds };
        },
        onSuccess: (data, followingId) => {
            if (data) {
                queryClient.setQueriesData({ queryKey: feedKeys.all }, (oldData: any) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any[]) => 
                            page.map((item) => 
                                item.uploader_id === followingId 
                                    ? { ...item, is_followed_by_user: data.new_is_followed } 
                                    : item
                            )
                        )
                    };
                });
            }
        },
        onError: (err: unknown, _vars, context) => {
            console.error("Follow toggle failed", err);
            if (context?.previousFeeds) {
                context.previousFeeds.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            const message = err instanceof Error ? err.message : 'Unknown error';
            setToast({
                open: true,
                message: `Follow failed: ${message}`,
                severity: 'error'
            } as any);
        }
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
        mutationFn: ({ mediaId, mediaType, content, parentId }: { mediaId: string; mediaType: 'photo' | 'video', content: string, parentId?: string, spotId?: string }) =>
            feedService.postMediaComment(mediaId, mediaType, content, parentId),
        onSuccess: (_, { mediaId, spotId }) => {
            // Invalidate comments for this media and the feed (for comment count)
            queryClient.invalidateQueries({ queryKey: feedKeys.comments(mediaId) });
            queryClient.invalidateQueries({ queryKey: feedKeys.global() });
            // Invalidate spot details query to update media comment counts
            if (spotId) {
                queryClient.invalidateQueries({ queryKey: spotKeys.details(spotId) });
            }
        },
    });
}

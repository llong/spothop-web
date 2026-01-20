import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import { useEffect } from 'react';

export const profileKeys = {
    all: ['profile'] as const,
    detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
    social: (userId: string) => [...profileKeys.all, 'social', userId] as const,
    content: (userId: string) => [...profileKeys.all, 'content', userId] as const,
    notifications: (userId: string) => [...profileKeys.all, 'notifications', userId] as const,
};

/**
 * Hook for basic profile data (identity).
 */
export function useProfileQuery(userId?: string) {
    return useQuery({
        queryKey: userId ? profileKeys.detail(userId) : ['profile', 'none'],
        queryFn: () => userId ? profileService.fetchIdentity(userId) : null,
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook for social stats and favorites.
 */
export function useSocialStatsQuery(userId?: string, enabled = true) {
    const queryClient = useQueryClient();

    // Force refresh follower counts when userId changes (RPC function was deployed)
    useEffect(() => {
        if (userId) {
            // Invalidate the social stats query to force fresh data
            queryClient.invalidateQueries({ queryKey: profileKeys.social(userId) });
        }
    }, [userId, queryClient]);

    return useQuery({
        queryKey: userId ? profileKeys.social(userId) : ['profile', 'social', 'none'],
        queryFn: async () => {
            if (!userId) return null;
            const [favorites, likes, stats] = await Promise.all([
                profileService.fetchFavoriteSpots(userId),
                profileService.fetchLikedMedia(userId),
                profileService.fetchFollowStats(userId)
            ]);
            return { favorites, likes, ...stats };
        },
        enabled: !!userId && enabled,
        staleTime: 1000 * 60 * 1, // 1 minute (reduced for faster follower count updates)
    });
}

/**
 * Hook for created spots and uploaded media.
 */
export function useUserContentQuery(userId?: string, enabled = true) {
    return useQuery({
        queryKey: userId ? profileKeys.content(userId) : ['profile', 'content', 'none'],
        queryFn: () => userId ? profileService.fetchUserContent(userId) : null,
        enabled: !!userId && enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook for notifications.
 */
export function useNotificationsQuery(userId?: string) {
    return useQuery({
        queryKey: userId ? profileKeys.notifications(userId) : ['profile', 'notifications', 'none'],
        queryFn: () => userId ? profileService.fetchNotifications(userId) : null,
        enabled: !!userId,
        staleTime: 1000 * 15, // 15 seconds
    });
}

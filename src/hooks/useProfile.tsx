import { useAtomValue } from "jotai";
import { userAtom } from "../atoms/auth";
import supabase from "../supabase";
import type { UserProfile } from "../types";
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery } from "./useProfileQueries";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Re-architected useProfile hook.
 * Now acts as a pure pass-through for TanStack Query hooks.
 * This eliminates all internal useEffects and redundant fetches.
 * 
 * @param userId - Optional user ID to fetch (defaults to current user)
 * @param includeExtendedData - If false, only basic identity is fetched (useful for AppBar)
 */
export const useProfile = (userId?: string, includeExtendedData = true) => {
    const user = useAtomValue(userAtom);
    const targetUserId = userId || user?.user.id;
    const queryClient = useQueryClient();

    // 1. Identity Query
    const profileQuery = useProfileQuery(targetUserId);

    // 2. Social Data Query (Enabled only if identity is loaded AND requested)
    const socialQuery = useSocialStatsQuery(
        targetUserId,
        includeExtendedData && !!profileQuery.data?.displayName
    );

    // 3. Content Data Query (Enabled only if identity is loaded AND requested)
    const contentQuery = useUserContentQuery(
        targetUserId,
        includeExtendedData && !!profileQuery.data?.displayName
    );

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user?.user.id) return;
        try {
            const { error } = await supabase.from("profiles").upsert({
                ...updates,
                id: user.user.id,
                updatedAt: new Date()
            });
            if (error) throw error;

            // Invalidate all related queries to force a refresh
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        } catch (error: any) {
            alert(error.message);
        }
    };

    return {
        // Data
        profile: profileQuery.data,
        favoriteSpots: socialQuery.data?.favorites || [],
        likedMedia: socialQuery.data?.likes || [],
        followerCount: socialQuery.data?.followerCount || 0,
        followingCount: socialQuery.data?.followingCount || 0,
        createdSpots: contentQuery.data?.createdSpots || [],
        userMedia: contentQuery.data?.userMedia || [],

        // Loading states
        loadingProfile: profileQuery.isLoading,
        loadingMedia: socialQuery.isLoading,
        loadingContent: contentQuery.isLoading,

        // Actions
        updateProfile,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['profile', 'detail', targetUserId] })
    };
};

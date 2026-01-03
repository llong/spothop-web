import { createFileRoute, redirect } from "@tanstack/react-router";
import supabase from "../../supabase";
import { profileKeys } from "../../hooks/useProfileQueries";
import { profileService } from "src/services/profileService";
import type { UserProfile } from "../../types";

export const Route = createFileRoute("/profile/")({
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({ to: '/login' });
        }
        return { userId: session.user.id };
    },
    loader: async ({ context }) => {
        const { queryClient } = context as any;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        // Prefetch basic identity
        await queryClient.ensureQueryData({
            queryKey: profileKeys.detail(userId),
            queryFn: () => profileService.fetchIdentity(userId),
        });

        const profile = queryClient.getQueryData(profileKeys.detail(userId)) as UserProfile | undefined;

        // Prefetch social and content data if onboarding is complete
        if (profile?.displayName) {
            await Promise.all([
                queryClient.ensureQueryData({
                    queryKey: profileKeys.social(userId),
                    queryFn: async () => {
                        const [favorites, likes, stats] = await Promise.all([
                            profileService.fetchFavoriteSpots(userId),
                            profileService.fetchLikedMedia(userId),
                            profileService.fetchFollowStats(userId)
                        ]);
                        return { favorites, likes, ...stats };
                    },
                }),
                queryClient.ensureQueryData({
                    queryKey: profileKeys.content(userId),
                    queryFn: () => profileService.fetchUserContent(userId),
                })
            ]);
        }
    }
});

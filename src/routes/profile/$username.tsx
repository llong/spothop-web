import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import supabase from '../../supabase';
import { Container, Box, Typography, Avatar, Card, CardContent, Grid, Divider, Button } from '@mui/material';
import type { UserProfile } from '../../types';
import { useAtomValue } from 'jotai';
import { userAtom } from '../../atoms/auth';
import { useState, useEffect } from 'react';
import { UserContentGallery } from './-components/UserContentGallery';
import { profileKeys, useProfileQuery, useSocialStatsQuery, useUserContentQuery } from 'src/hooks/useProfileQueries';
import { profileService } from 'src/services/profileService';

// Loader function to fetch profile data
const loader = async ({ params, context }: { params: { username: string }, context: any }) => {
    const { queryClient } = context;

    // 1. Fetch profile ID by username first
    const { data: profileRef, error } = await supabase
        .from('profiles')
        .select(`id`)
        .eq('username', params.username)
        .single();

    if (error) throw new Error(error.message);
    const userId = profileRef.id;

    // 2. Prefetch everything via QueryClient
    await Promise.all([
        queryClient.ensureQueryData({
            queryKey: profileKeys.detail(userId),
            queryFn: () => profileService.fetchIdentity(userId),
        }),
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

    return { userId };
};

const PublicProfileComponent = () => {
    const navigate = useNavigate();
    const { userId } = Route.useLoaderData();
    const user = useAtomValue(userAtom);

    // Use Query hooks (they will pull from cache populated by loader)
    const { data: profile } = useProfileQuery(userId);
    const { data: contentData } = useUserContentQuery(userId);

    const createdSpots = contentData?.createdSpots || [];
    const uploadedMedia = contentData?.userMedia || [];
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkFollowing = async () => {
            if (user?.user.id && profile?.id) {
                const { data } = await supabase
                    .from('user_followers')
                    .select('*')
                    .eq('follower_id', user.user.id)
                    .eq('following_id', profile.id)
                    .single();
                setIsFollowing(!!data);
            }
        };
        checkFollowing();
    }, [user, profile?.id]);

    const handleFollowToggle = async () => {
        if (!user?.user.id || !profile?.id) return;
        setIsLoading(true);
        try {
            if (isFollowing) {
                await supabase
                    .from('user_followers')
                    .delete()
                    .eq('follower_id', user.user.id)
                    .eq('following_id', profile.id);
                setIsFollowing(false);
            } else {
                await supabase
                    .from('user_followers')
                    .insert({
                        follower_id: user.user.id,
                        following_id: profile.id
                    });
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!profile) {
        return (
            <Container sx={{ mt: 5 }}>
                <Typography variant="h4">Profile not found</Typography>
            </Container>
        );
    }

    const isOwnProfile = user?.user.id === profile.id;

    return (
        <Container sx={{ mt: 5 }}>
            <Button onClick={() => navigate({ to: '..' })}>Back</Button>
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Avatar src={profile.avatarUrl || ""} sx={{ width: 120, height: 120, mb: 2 }} />
                            <Typography variant="h4" fontWeight={800}>{profile.displayName || profile.username}</Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>@{profile.username}</Typography>
                            <Typography variant="body1" color="text.secondary">{profile.city}, {profile.country}</Typography>

                            <Box sx={{ display: 'flex', gap: 4, my: 2 }}>
                                <Box>
                                    <Typography variant="h6">{profile.followerCount || 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Followers</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6">{profile.followingCount || 0}</Typography>
                                    <Typography variant="caption" color="text.secondary">Following</Typography>
                                </Box>
                            </Box>

                            {user?.user && !isOwnProfile && (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant={isFollowing ? "outlined" : "contained"}
                                        onClick={handleFollowToggle}
                                        disabled={isLoading}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                </Box>
                            )}

                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Typography variant="h6">Bio</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{profile.bio}</Typography>
                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Box>
                                <Typography variant="h6">Rider Type</Typography>
                                <Typography variant="body1">{profile.riderType}</Typography>
                            </Box>
                            {profile.instagramHandle && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6">Instagram</Typography>
                                    <Typography variant="body1">@{profile.instagramHandle}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                {profile.username}'s Activity
                            </Typography>
                            <UserContentGallery
                                createdSpots={createdSpots}
                                uploadedMedia={uploadedMedia}
                                isLoading={false}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export const Route = createFileRoute('/profile/$username')({
    component: PublicProfileComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({ to: '/login' });
        }
    },
    loader,
});

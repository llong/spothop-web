import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import supabase from '../../supabase';
import { Container, Box, Typography, Avatar, Card, CardContent, Grid, Divider, Button, Stack } from '@mui/material';
import { useAtomValue } from 'jotai';
import { userAtom } from '../../atoms/auth';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserContentGallery } from './-components/UserContentGallery';
import { profileKeys, useProfileQuery, useUserContentQuery } from 'src/hooks/useProfileQueries';
import { UserStats } from './-components/UserStats';
import { profileService } from 'src/services/profileService';
import { getOptimizedImageUrl } from 'src/utils/imageOptimization';
import { chatService, blockService } from 'src/services/chatService';
import { analytics } from 'src/lib/posthog';
import SEO from '@/components/SEO/SEO';

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
    const queryClient = useQueryClient();
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
                    .maybeSingle();
                setIsFollowing(!!data);
            } else {
                setIsFollowing(false);
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
                analytics.capture('user_unfollowed', { target_user_id: profile.id });
            } else {
                await supabase
                    .from('user_followers')
                    .insert({
                        follower_id: user.user.id,
                        following_id: profile.id
                    });
                setIsFollowing(true);
                analytics.capture('user_followed', { target_user_id: profile.id });
            }
            // Invalidate the social stats query to refresh follower counts
            await queryClient.invalidateQueries({ queryKey: profileKeys.social(profile.id) });
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

    const displayName = profile.displayName || profile.username;

    return (
        <Container sx={{ mt: 5 }}>
            <SEO
                title={displayName || undefined}
                description={`Check out ${displayName}'s profile on SpotHop. See their favorite spots and latest clips.`}
                image={profile.avatarUrl || undefined}
                url={`/profile/${profile.username}`}
            />
            <Button onClick={() => navigate({ to: '..' })}>Back</Button>
            <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <Avatar
                                src={profile.avatarUrl ? getOptimizedImageUrl(profile.avatarUrl) : ""}
                                alt={`${displayName}'s avatar`}
                                sx={{ width: 120, height: 120, mb: 2 }}
                            />
                            <Typography variant="h4" component="h1" fontWeight={800}>{displayName}</Typography>
                            <Typography variant="subtitle1" component="p" color="text.secondary" gutterBottom>@{profile.username}</Typography>
                            <Typography variant="body1" component="p" color="text.secondary">{profile.city}, {profile.country}</Typography>

                            <Box sx={{ my: 2, width: '100%' }}>
                                <UserStats userId={userId} />
                            </Box>

                            {user?.user && !isOwnProfile && (
                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                    <Button
                                        variant={isFollowing ? "outlined" : "contained"}
                                        onClick={handleFollowToggle}
                                        disabled={isLoading}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={async () => {
                                            const chatId = await chatService.getOrCreate1on1(user.user.id, profile.id);
                                            navigate({ to: '/chat/$conversationId', params: { conversationId: chatId } });
                                        }}
                                    >
                                        Message
                                    </Button>
                                    <Button
                                        variant="text"
                                        color="error"
                                        size="small"
                                        onClick={async () => {
                                            if (window.confirm(`Block @${profile.username}? They won't be able to message you.`)) {
                                                await blockService.blockUser(user.user.id, profile.id);
                                                navigate({ to: '/' });
                                            }
                                        }}
                                    >
                                        Block
                                    </Button>
                                </Stack>
                            )}

                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Typography variant="h6" component="h2" fontWeight={700}>Bio</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{profile.bio}</Typography>
                            <Divider sx={{ my: 2, width: '100%' }} />
                            <Box>
                                <Typography variant="h6" component="h2" fontWeight={700}>Rider Type</Typography>
                                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{profile.riderType}</Typography>
                            </Box>
                            {profile.instagramHandle && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" component="h2" fontWeight={700}>Instagram</Typography>
                                    <Typography variant="body1">@{profile.instagramHandle}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" component="h2" gutterBottom fontWeight={700}>
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

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import supabase from '../../supabase';
import { Container, Box, Typography, Avatar, Card, CardContent, Grid, Divider, Button } from '@mui/material';
import type { UserProfile } from '../../types';
import { useAtomValue } from 'jotai';
import { userAtom } from '../../atoms/auth';
import { useState, useEffect } from 'react';
import { UserContentGallery } from './-components/UserContentGallery';

// Loader function to fetch profile data
const loader = async ({ params }: { params: { username: string } }) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`id, username, "avatarUrl", city, country, "riderType", bio, "instagramHandle"`)
        .eq('username', params.username)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch follow counts
    const [followersResult, followingResult] = await Promise.all([
        supabase
            .from("user_followers")
            .select("*", { count: 'exact', head: true })
            .eq("following_id", profile.id),
        supabase
            .from("user_followers")
            .select("*", { count: 'exact', head: true })
            .eq("follower_id", profile.id)
    ]);

    // Fetch user content
    const [spotsResult, photosResult, videosResult] = await Promise.all([
        supabase
            .from('spots')
            .select('*, spot_photos(url)')
            .eq('created_by', profile.id)
            .order('created_at', { ascending: false }),
        supabase
            .from('spot_photos')
            .select('id, url, created_at, spots(id, name)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false }),
        supabase
            .from('spot_videos')
            .select('id, url, thumbnail_url, created_at, spots(id, name)')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
    ]);

    const createdSpots = (spotsResult.data || []).map((spot: any) => ({
        ...spot,
        photoUrl: spot.spot_photos?.[0]?.url || null
    }));

    const uploadedMedia = [
        ...(photosResult.data || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            type: 'photo' as const,
            created_at: p.created_at,
            spot: {
                id: p.spots?.id,
                name: p.spots?.name
            }
        })),
        ...(videosResult.data || []).map((v: any) => ({
            id: v.id,
            url: v.url,
            thumbnailUrl: v.thumbnail_url,
            type: 'video' as const,
            created_at: v.created_at,
            spot: {
                id: v.spots?.id,
                name: v.spots?.name
            }
        }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
        profile: {
            ...profile,
            followerCount: followersResult.count || 0,
            followingCount: followingResult.count || 0
        } as UserProfile,
        createdSpots,
        uploadedMedia
    };
};

const PublicProfileComponent = () => {
    const navigate = useNavigate();
    const { profile, createdSpots, uploadedMedia } = Route.useLoaderData();
    const user = useAtomValue(userAtom);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkFollowing = async () => {
            if (user?.user.id && profile.id) {
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
    }, [user, profile.id]);

    const handleFollowToggle = async () => {
        if (!user?.user.id) return;
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
                            <Typography variant="h4">{profile.username}</Typography>
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
    loader,
});

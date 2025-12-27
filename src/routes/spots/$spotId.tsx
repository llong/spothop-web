import { createFileRoute, useRouter } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { Container, Box, Typography, Snackbar, Divider, Grid } from '@mui/material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useState } from 'react';
import type { Spot, MediaItem } from 'src/types';
import { SpotGallery } from './-components/SpotGallery';
import { SpotHeader } from './-components/SpotHeader';
import { SpotInfo } from './-components/SpotInfo';
import { SpotCreatorInfo } from './-components/SpotCreatorInfo';
import { AddMediaDialog } from './-components/AddMediaDialog';
import { SpotSidebar } from './-components/SpotSidebar';

const loader = async ({ params }: { params: { spotId: string } }) => {
    // 1. Get Session for server-side-like fetching
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    // 2. Fetch Spot with Media and Likes
    const spotPromise = supabase
        .from('spots')
        .select(`
            *,
            spot_photos (
                id,
                url,
                created_at,
                user_id,
                media_likes!photo_id (
                    user_id
                )
            ),
            spot_videos (
                id,
                url,
                thumbnail_url,
                created_at,
                user_id,
                media_likes!video_id (
                    user_id
                )
            )
        `)
        .eq('id', params.spotId)
        .single();

    // 3. Fetch Favorite Status and Total Count
    const favoriteStatusPromise = userId
        ? supabase
            .from('user_favorite_spots')
            .select('*')
            .eq('user_id', userId)
            .eq('spot_id', params.spotId)
        : Promise.resolve({ data: null, error: null });

    const favoriteCountPromise = supabase
        .from('user_favorite_spots')
        .select('profiles(username)', { count: 'exact' })
        .eq('spot_id', params.spotId);

    const flagCountPromise = supabase
        .from('spot_flags')
        .select('*', { count: 'exact', head: true })
        .eq('spot_id', params.spotId);

    const [spotResult, favoriteStatusResult, favoriteCountResult, flagCountResult] = await Promise.all([
        spotPromise,
        favoriteStatusPromise,
        favoriteCountPromise,
        flagCountPromise
    ]);

    if (spotResult.error) {
        throw new Error(spotResult.error.message);
    }

    // 4. Fetch all unique authors profiles for the spot and its media
    const mediaAuthorIds = [
        ...(spotResult.data.spot_photos || []).map((p: any) => p.user_id),
        ...(spotResult.data.spot_videos || []).map((v: any) => v.user_id),
        spotResult.data.created_by
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    const { data: profiles, error: profilesError } = mediaAuthorIds.length > 0
        ? await supabase.from('profiles').select('id, username, "avatarUrl"').in('id', mediaAuthorIds)
        : { data: [], error: null };

    if (profilesError) throw profilesError;

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
    }, {});

    const creatorProfile = profileMap[spotResult.data.created_by];

    const photos: MediaItem[] = spotResult.data.spot_photos?.map((p: any) => {
        const author = profileMap[p.user_id];
        return {
            id: p.id,
            url: p.url,
            type: 'photo' as const,
            createdAt: p.created_at,
            author: {
                id: p.user_id,
                username: author?.username || 'unknown',
                avatarUrl: author?.avatarUrl || null
            },
            likeCount: p.media_likes?.length || 0,
            isLiked: userId ? p.media_likes?.some((l: any) => l.user_id === userId) : false
        };
    }) || [];

    const videos: MediaItem[] = spotResult.data.spot_videos?.map((v: any) => {
        const author = profileMap[v.user_id];
        return {
            id: v.id,
            url: v.url,
            thumbnailUrl: v.thumbnail_url,
            type: 'video' as const,
            createdAt: v.created_at,
            author: {
                id: v.user_id,
                username: author?.username || 'unknown',
                avatarUrl: author?.avatarUrl || null
            },
            likeCount: v.media_likes?.length || 0,
            isLiked: userId ? v.media_likes?.some((l: any) => l.user_id === userId) : false
        };
    }) || [];

    const spot = {
        ...spotResult.data,
        photoUrl: photos[0]?.url || null,
        media: [...photos, ...videos],
        username: creatorProfile?.username,
        favoriteCount: favoriteCountResult.count || 0,
        favoritedBy: favoriteCountResult.data?.map((f: any) => f.profiles?.username).filter(Boolean) || [],
        flagCount: flagCountResult.count || 0,
    };

    const isFavorited = !!(userId && favoriteStatusResult.data && favoriteStatusResult.data.length > 0);

    return {
        spot: spot as Spot & {
            media: MediaItem[],
            username?: string,
            favoriteCount: number,
            favoritedBy: string[],
            flagCount: number,
        },
        isFavoritedInitial: isFavorited
    };
};

const SpotDetailsComponent = () => {
    const router = useRouter();
    const { spot, isFavoritedInitial } = Route.useLoaderData();
    const user = useAtomValue(userAtom);

    const [isFavorited, setIsFavorited] = useState(isFavoritedInitial);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);

    const toggleFavorite = async () => {
        if (!user?.user.id) return;

        try {
            if (isFavorited) {
                await supabase
                    .from('user_favorite_spots')
                    .delete()
                    .eq('user_id', user.user.id)
                    .eq('spot_id', spot.id);
                setSnackbarMessage('Removed from favorites');
            } else {
                await supabase
                    .from('user_favorite_spots')
                    .insert({ user_id: user.user.id, spot_id: spot.id });
                setSnackbarMessage('Added to favorites');
            }
            setIsFavorited(!isFavorited);
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error toggling favorite:', error);
            setSnackbarMessage('Error updating favorite status');
            setSnackbarOpen(true);
        }
    };

    if (!spot) {
        return (
            <Container sx={{ mt: 5 }}>
                <Typography variant="h4">Spot not found</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 4 }}>
            <SpotHeader
                spotId={spot.id}
                spotName={spot.name}
                onBack={() => router.history.back()}
                isFavorited={isFavorited}
                favoriteCount={spot.favoriteCount}
                flagCount={spot.flagCount}
                onToggleFavorite={toggleFavorite}
                isLoggedIn={!!user?.user}
                onReportSuccess={() => {
                    setSnackbarMessage('Thank you for your report. Our moderators will review it.');
                    setSnackbarOpen(true);
                }}
            />

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <SpotGallery media={spot.media} />
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <SpotInfo spot={spot} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <SpotSidebar
                            spot={spot}
                            isFavorited={isFavorited}
                            onToggleFavorite={toggleFavorite}
                            onAddMedia={() => setAddMediaDialogOpen(true)}
                            isLoggedIn={!!user?.user}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <SpotCreatorInfo
                    createdAt={spot.created_at}
                    username={spot.username}
                />
            </Container>

            <AddMediaDialog
                spotId={spot.id}
                spotName={spot.name}
                open={addMediaDialogOpen}
                onClose={() => setAddMediaDialogOpen(false)}
                onSuccess={() => {
                    setSnackbarMessage('Media uploaded successfully!');
                    setSnackbarOpen(true);
                    router.invalidate();
                }}
                user={user}
            />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export const Route = createFileRoute('/spots/$spotId')({
    component: SpotDetailsComponent,
    loader,
});

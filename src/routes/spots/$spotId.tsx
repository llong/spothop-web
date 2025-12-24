import { createFileRoute, useRouter } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { Container, Box, Typography, Snackbar, Divider } from '@mui/material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useState } from 'react';
import type { Spot } from 'src/types';
import { SpotGallery } from './-components/SpotGallery';
import { SpotHeader } from './-components/SpotHeader';
import { SpotInfo } from './-components/SpotInfo';
import { SpotCreatorInfo } from './-components/SpotCreatorInfo';

const loader = async ({ params }: { params: { spotId: string } }) => {
    // 1. Get Session for server-side-like fetching
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    // 2. Fetch Spot
    const spotPromise = supabase
        .from('spots')
        .select('*, spot_photos(url)')
        .eq('id', params.spotId)
        .single();

    // 3. Fetch Favorite Status (if user exists)
    const favoritePromise = userId
        ? supabase
            .from('user_favorite_spots')
            .select('*')
            .eq('user_id', userId)
            .eq('spot_id', params.spotId)
        : Promise.resolve({ data: null, error: null });

    const [spotResult, favoriteResult] = await Promise.all([spotPromise, favoritePromise]);

    if (spotResult.error) {
        throw new Error(spotResult.error.message);
    }

    // 4. Fetch Creator Profile manually
    let username = undefined;
    if (spotResult.data.created_by) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', spotResult.data.created_by)
            .single();
        username = profile?.username;
    }

    const spot = {
        ...spotResult.data,
        photoUrl: spotResult.data.spot_photos?.[0]?.url || null,
        photos: spotResult.data.spot_photos?.map((p: any) => p.url) || [],
        username: username
    };

    const isFavorited = !!(userId && favoriteResult.data && favoriteResult.data.length > 0);

    return {
        spot: spot as Spot & { photos: string[], username?: string },
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
                onBack={() => router.history.back()}
                isFavorited={isFavorited}
                onToggleFavorite={toggleFavorite}
                isLoggedIn={!!user?.user}
            />

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <SpotGallery photos={spot.photos} videoUrl={spot.videoUrl} />
                <SpotInfo spot={spot} />

                <Divider sx={{ my: 3 }} />

                <SpotCreatorInfo
                    createdAt={spot.created_at}
                    username={spot.username}
                />
            </Container>

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

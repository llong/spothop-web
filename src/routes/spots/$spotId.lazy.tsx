import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { SpotGallery } from './-components/SpotGallery'
import { SpotHeader } from './-components/SpotHeader'
import { SpotInfo } from './-components/SpotInfo'
import { SpotSidebar } from './-components/SpotSidebar'
import { SpotCreatorInfo } from './-components/SpotCreatorInfo'
import { CommentSection } from './-components/CommentSection'
import { AddMediaDialog } from './-components/AddMediaDialog'
import { SpotDetailSkeleton } from './-components/SpotCardSkeleton'
import { Box, Container, Grid, Divider, Typography, Snackbar } from '@mui/material'
import { useSpotQuery } from 'src/hooks/useSpotQueries'
import { useAtomValue } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import { useState, useMemo } from 'react'
import supabase from 'src/supabase'

export const Route = createLazyFileRoute('/spots/$spotId')({
    component: SpotDetailsComponent,
})

function SpotDetailsComponent() {
    const router = useRouter();
    const { spotId } = Route.useParams();
    const user = useAtomValue(userAtom);

    const { data: spot, isLoading: loadingSpot } = useSpotQuery(spotId, user?.user.id);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    // Sync favorite state with query data
    useMemo(() => {
        if (spot) setIsFavorited(spot.isFavorited);
    }, [spot?.isFavorited]);

    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);

    if (loadingSpot) {
        return <SpotDetailSkeleton />;
    }

    if (!spot) {
        return (
            <Container sx={{ mt: 5 }}>
                <Typography variant="h4">Spot not found</Typography>
            </Container>
        );
    }

    const toggleFavorite = async () => {
        if (!user?.user.id || !spot) return;

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
                    createdBy={spot.created_by}
                />

                <Divider sx={{ my: 4 }} />

                <CommentSection spotId={spot.id} />
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
}

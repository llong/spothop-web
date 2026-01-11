import { createLazyFileRoute } from '@tanstack/react-router'
import { SpotGallery } from './-components/SpotGallery'
import { SpotInfo } from './-components/SpotInfo/SpotInfo'
import { SpotSidebar } from './-components/SpotSidebar/SpotSidebar'
import { SpotCreatorInfo } from './-components/SpotCreatorInfo'
import { CommentSection } from './-components/CommentSection'
import { AddMediaDialog } from './-components/AddMediaDialog'
import { SpotDetailSkeleton } from './-components/SpotCardSkeleton'
import { Box, Container, Grid, Divider, Typography, Snackbar } from '@mui/material'
import { useSpotQuery } from 'src/hooks/useSpotQueries'
import { useAtomValue } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import { useState } from 'react'
import { useSpotFavorites } from 'src/hooks/useSpotFavorites'

export const Route = createLazyFileRoute('/spots/$spotId')({
    component: SpotDetailsComponent,
})

function SpotDetailsComponent() {
    const { spotId } = Route.useParams();
    const user = useAtomValue(userAtom);

    const { data: spot, isLoading: loadingSpot } = useSpotQuery(spotId, user?.user.id);
    const { isFavorited, toggleFavorite } = useSpotFavorites(spot ?? undefined, user?.user.id);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
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

    const handleToggleFavorite = async () => {
        const result = await toggleFavorite();
        if (result) {
            setSnackbarMessage(result.message);
            setSnackbarOpen(true);
        }
    };

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 4 }}>
            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <SpotGallery media={spot.media} />
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <SpotInfo
                            spot={spot}
                            isFavorited={isFavorited}
                            onToggleFavorite={handleToggleFavorite}
                            isLoggedIn={!!user?.user}
                            onReportSuccess={() => {
                                setSnackbarMessage('Thank you for your report. Our moderators will review it.');
                                setSnackbarOpen(true);
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <SpotSidebar
                            spot={spot}
                            isFavorited={isFavorited}
                            onToggleFavorite={handleToggleFavorite}
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

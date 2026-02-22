import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Stack,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Divider
} from '@mui/material';
import supabase from 'src/supabase';
import { VideoUpload } from './-components/VideoUpload';
import { PhotoUpload } from './-components/PhotoUpload';
import { LocationPreview } from './-components/LocationPreview';
import { SpotDetailsForm } from './-components/SpotDetailsForm';
import { SpotCharacteristics } from './-components/SpotCharacteristics';
import { useNewSpotForm } from './hooks/useNewSpotForm';

export const NewSpotComponent = () => {
    const { lat, lng } = Route.useSearch();
    const {
        formState,
        submissionState,
        handleSubmit
    } = useNewSpotForm(lat, lng);

    const {
        name, setName,
        description, setDescription,
        spotType, setSpotType,
        difficulty, setDifficulty,
        isLit, setIsLit,
        kickoutRisk, setKickoutRisk,
        setSelectedPhotos,
        setSelectedVideos,
        address,
    } = formState;

    const {
        isSubmitting,
        error,
        setError,
        success,
        statusMessage,
        isOnline,
    } = submissionState;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={success}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    Spot created successfully! Redirecting...
                </Alert>
            </Snackbar>

            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Add a New Spot
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Share a new skate spot with the community.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <LocationPreview lat={lat} lng={lng} address={address} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Stack spacing={3}>
                                    <SpotDetailsForm
                                        name={name}
                                        setName={setName}
                                        description={description}
                                        setDescription={setDescription}
                                        error={error}
                                    />

                                    <SpotCharacteristics
                                        spotType={spotType}
                                        setSpotType={setSpotType}
                                        difficulty={difficulty}
                                        setDifficulty={setDifficulty}
                                        isLit={isLit}
                                        setIsLit={setIsLit}
                                        kickoutRisk={kickoutRisk}
                                        setKickoutRisk={setKickoutRisk}
                                    />

                                    <Divider />

                                    <Box>
                                        <Typography variant="h6" gutterBottom fontWeight="bold">Media</Typography>
                                        <Stack spacing={3} sx={{ mt: 1 }}>
                                            <Box>
                                                <PhotoUpload onFilesSelect={setSelectedPhotos} />
                                            </Box>
                                            <Divider />
                                            <Box>
                                                <VideoUpload onFilesSelect={setSelectedVideos} />
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={isSubmitting || !isOnline}
                                        sx={{ py: 1.5, mt: 2, fontWeight: 'bold', fontSize: '1.1rem' }}
                                    >
                                        {!isOnline ? 'Offline' : isSubmitting ? (
                                            <Stack direction="row" gap={2} alignItems="center">
                                                <CircularProgress size={20} color="inherit" />
                                                {statusMessage}
                                            </Stack>
                                        ) : 'Create Spot'}
                                    </Button>
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
};

const newSpotSearchSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
});

export const Route = createFileRoute('/spots/new')({
    component: NewSpotComponent,
    validateSearch: (search) => newSpotSearchSchema.parse(search),
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({
                to: '/login',
            });
        }
    },
});

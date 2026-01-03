import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useMediaUpload } from 'src/hooks/useMediaUpload';
import type { VideoAsset } from 'src/types';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';

export const NewSpotComponent = () => {
    const isOnline = useOnlineStatus();
    const { lat, lng } = Route.useSearch();
    const navigate = useNavigate();

    // Form State
    const [address, setAddress] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    // File selection state
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);

    const [spotId, setSpotId] = useState<string | null>(null);
    const [spotType, setSpotType] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('beginner');
    const [kickoutRisk, setKickoutRisk] = useState<number>(1);
    const [isLit, setIsLit] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const user = useAtomValue(userAtom);
    const { uploadMedia } = useMediaUpload({ user, setStatusMessage });

    useEffect(() => {
        setSpotId(uuidv4());
    }, []);

    useEffect(() => {
        const getAddress = async () => {
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE'}`);
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    setAddress(result.formatted_address);

                    const postalCodeComponent = result.address_components.find((c: any) => c.types.includes('postal_code'));
                    if (postalCodeComponent) {
                        setPostalCode(postalCodeComponent.long_name);
                    }

                    const cityComponent = result.address_components.find((c: any) => c.types.includes('locality') || c.types.includes('administrative_area_level_1') || c.types.includes('administrative_area_level_2'));
                    if (cityComponent) {
                        setCity(cityComponent.long_name);
                    }

                    const stateComponent = result.address_components.find((c: any) => c.types.includes('administrative_area_level_1'));
                    if (stateComponent) {
                        setState(stateComponent.short_name);
                    }

                    const countryComponent = result.address_components.find((c: any) => c.types.includes('country'));
                    if (countryComponent) {
                        setCountry(countryComponent.long_name);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch address", e);
            }
        };
        getAddress();
    }, [lat, lng]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        // Validation
        if (!name.trim()) {
            setError('Spot Name is required.');
            return;
        }
        if (!description.trim()) {
            setError('Description is required.');
            return;
        }
        if (selectedPhotos.length === 0) {
            setError('You must upload at least one photo.');
            return;
        }
        if (!user) {
            setError('You must be logged in to create a spot.');
            return;
        }
        if (!spotId) return;

        try {
            setIsSubmitting(true);
            setStatusMessage('Creating spot...');

            // 1. Create Spot
            const { error: spotError } = await supabase
                .from('spots')
                .insert([{
                    id: spotId,
                    name,
                    description,
                    address,
                    city,
                    state,
                    country,
                    postal_code: postalCode,
                    latitude: lat,
                    longitude: lng,
                    created_by: user.user.id,
                    spot_type: spotType,
                    difficulty,
                    kickout_risk: kickoutRisk,
                    is_lit: isLit,
                }]);

            if (spotError) throw spotError;

            // 2. Upload Media
            await uploadMedia(spotId, selectedPhotos, selectedVideos);

            setSuccess(true);
            setStatusMessage('Spot created successfully!');

            // Redirect after short delay
            setTimeout(() => {
                navigate({ to: '/', search: { lat, lng } });
            }, 1500);

        } catch (err: any) {
            console.error('Error creating spot:', err);
            setError(err.message || 'An unexpected error occurred.');
            setIsSubmitting(false);
        }
    };

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
                    {/* Left Column: Location & Media */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={3}>
                            <LocationPreview lat={lat} lng={lng} address={address} />

                            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">Media</Typography>
                                <Stack spacing={3}>
                                    <Box>
                                        <PhotoUpload onFilesSelect={setSelectedPhotos} />
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <VideoUpload onFilesSelect={setSelectedVideos} />
                                    </Box>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Column: Details Form */}
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

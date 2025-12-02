import { createFileRoute, useRouter } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { Container, Box, Typography, Divider, Button, IconButton, Grid, Chip, Stack, Paper } from '@mui/material';
import { Favorite, FavoriteBorder, ArrowBack, Share, Skateboarding } from '@mui/icons-material';
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useEffect, useState } from 'react';
import type { Spot } from 'src/types';

const loader = async ({ params }: { params: { spotId: string } }) => {
    const { data: spot, error } = await supabase
        .from('spots')
        .select('*')
        .eq('id', params.spotId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return spot as Spot;
};

const SpotDetailsComponent = () => {
    const router = useRouter();
    const spot = Route.useLoaderData();
    const user = useAtomValue(userAtom);
    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        const checkIfFavorited = async () => {
            if (user?.user.id && spot.id) {
                const { data } = await supabase
                    .from('user_favorite_spots')
                    .select('*')
                    .eq('user_id', user.user.id)
                    .eq('spot_id', spot.id);
                setIsFavorited(!!(data && data.length > 0));
            }
        };
        checkIfFavorited();
    }, [user, spot]);

    const toggleFavorite = async () => {
        if (!user?.user.id) {
            alert('You must be logged in to favorite a spot.');
            return;
        }

        if (isFavorited) {
            await supabase
                .from('user_favorite_spots')
                .delete()
                .eq('user_id', user.user.id)
                .eq('spot_id', spot.id);
        } else {
            await supabase
                .from('user_favorite_spots')
                .insert({ user_id: user.user.id, spot_id: spot.id });
        }
        setIsFavorited(!isFavorited);
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner': return 'success';
            case 'intermediate': return 'warning';
            case 'advanced': return 'error';
            default: return 'default';
        }
    };

    const getKickoutRiskLabel = (risk?: number) => {
        if (!risk) return null;
        if (risk <= 3) return { label: 'Low Risk', color: 'success' as const };
        if (risk <= 7) return { label: 'Medium Risk', color: 'warning' as const };
        return { label: 'High Risk', color: 'error' as const };
    };

    const kickoutRisk = getKickoutRiskLabel(spot.kickout_risk);

    // Placeholder images for the gallery
    const placeholderImages = [
        spot.photoUrl || 'https://via.placeholder.com/800x600/e0e0e0/757575?text=Spot+Photo+1',
        'https://via.placeholder.com/400x300/e0e0e0/757575?text=Spot+Photo+2',
        'https://via.placeholder.com/400x300/e0e0e0/757575?text=Spot+Photo+3',
        'https://via.placeholder.com/400x300/e0e0e0/757575?text=Spot+Photo+4',
        'https://via.placeholder.com/400x300/e0e0e0/757575?text=Spot+Photo+5',
    ];

    if (!spot) {
        return (
            <Container sx={{ mt: 5 }}>
                <Typography variant="h4">Spot not found</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 4 }}>
            {/* Header */}
            <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2 }}>
                <Container maxWidth="lg">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => router.history.back()}
                            sx={{ color: 'text.primary' }}
                        >
                            Back to search
                        </Button>
                        <Stack direction="row" spacing={1}>
                            {user?.user && (
                                <IconButton onClick={toggleFavorite}>
                                    {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                                </IconButton>
                            )}
                            <IconButton>
                                <Share />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* Photo Gallery Grid */}
                <Grid container spacing={1} sx={{ mb: 3, height: 450 }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                backgroundImage: `url(${placeholderImages[0]})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 2,
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {spot.videoUrl && (
                                <Chip
                                    label="Video Available"
                                    color="primary"
                                    sx={{ position: 'absolute', top: 16, left: 16 }}
                                />
                            )}
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Grid container spacing={1} sx={{ height: '100%' }}>
                            {placeholderImages.slice(1, 5).map((img, idx) => (
                                <Grid size={{ xs: 6, md: 12 }} key={idx}>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: idx < 2 ? 220 : { xs: 110, md: 220 },
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                    >
                                        {idx === 3 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    bgcolor: 'rgba(0,0,0,0.5)',
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Typography variant="h6" color="white" fontWeight={600}>
                                                    See all photos
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Main Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            {/* Spot Name and Address */}
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                {spot.name}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <LocationOnIcon color="action" />
                                <Typography variant="body1" color="text.secondary">
                                    {[spot.address, spot.city, spot.country, spot.postalCode].filter(Boolean).join(', ')}
                                </Typography>
                            </Stack>

                            {/* Key Stats */}
                            <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                                {spot.difficulty && (
                                    <Box>
                                        <Typography variant="h5" fontWeight={600}>
                                            {spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Difficulty
                                        </Typography>
                                    </Box>
                                )}
                                {spot.kickout_risk !== undefined && (
                                    <Box>
                                        <Typography variant="h5" fontWeight={600}>
                                            {spot.kickout_risk}/10
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Kickout Risk
                                        </Typography>
                                    </Box>
                                )}
                                {spot.is_lit !== undefined && (
                                    <Box>
                                        <Typography variant="h5" fontWeight={600}>
                                            {spot.is_lit ? 'Yes' : 'No'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Lit at Night
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>

                            <Divider sx={{ my: 3 }} />

                            {/* Spot Features/Metadata */}
                            <Box sx={{ mb: 3 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                    {spot.difficulty && (
                                        <Chip
                                            icon={<Skateboarding />}
                                            label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                            color={getDifficultyColor(spot.difficulty)}
                                        />
                                    )}
                                    {spot.is_lit && (
                                        <Chip
                                            icon={<LightModeIcon />}
                                            label="Lit at Night"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    )}
                                    {kickoutRisk && (
                                        <Chip
                                            icon={<WarningAmberIcon />}
                                            label={kickoutRisk.label}
                                            color={kickoutRisk.color}
                                            variant="outlined"
                                        />
                                    )}
                                </Stack>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* What's Special Section */}
                            {spot.spot_type && spot.spot_type.length > 0 && (
                                <>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        What's at this spot
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                                        {spot.spot_type.map((type, idx) => (
                                            <Chip
                                                key={idx}
                                                label={type.toUpperCase()}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        ))}
                                    </Stack>
                                    <Divider sx={{ my: 3 }} />
                                </>
                            )}

                            {/* Description */}
                            {spot.description && (
                                <>
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        About this spot
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        {spot.description}
                                    </Typography>
                                </>
                            )}

                            {/* Video Section */}
                            {spot.videoUrl && (
                                <>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" fontWeight={600} gutterBottom>
                                        Spot Video
                                    </Typography>
                                    <Box
                                        component="video"
                                        src={spot.videoUrl}
                                        controls
                                        sx={{
                                            width: '100%',
                                            maxHeight: 400,
                                            borderRadius: 2,
                                            bgcolor: 'black'
                                        }}
                                    />
                                </>
                            )}
                        </Paper>
                    </Grid>

                    {/* Sidebar */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Spot Details
                            </Typography>
                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={2}>
                                {spot.difficulty && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Difficulty Level
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                        </Typography>
                                    </Box>
                                )}

                                {spot.is_lit !== undefined && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Lighting
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {spot.is_lit ? 'Lit at night' : 'Not lit'}
                                        </Typography>
                                    </Box>
                                )}

                                {spot.kickout_risk !== undefined && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Kickout Risk
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {spot.kickout_risk}/10
                                        </Typography>
                                    </Box>
                                )}

                                {spot.spot_type && spot.spot_type.length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Features
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {spot.spot_type.join(', ')}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>

                            {user?.user && (
                                <>
                                    <Divider sx={{ my: 2 }} />

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={toggleFavorite}
                                        startIcon={isFavorited ? <Favorite /> : <FavoriteBorder />}
                                    >
                                        {isFavorited ? 'Saved' : 'Save Spot'}
                                    </Button>
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export const Route = createFileRoute('/spots/$spotId')({
    component: SpotDetailsComponent,
    loader,
});


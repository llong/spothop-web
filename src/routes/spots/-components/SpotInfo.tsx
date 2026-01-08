import { Paper, Typography, Stack, Box, Divider, Chip, IconButton, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Skateboarding, FavoriteBorder, Favorite, FlagOutlined, Share } from '@mui/icons-material';
import type { Spot } from 'src/types';
import { Link as RouterLink } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { FlagSpotDialog } from './FlagSpotDialog';
import { reverseGeocode } from 'src/utils/geocoding';

interface SpotInfoProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    isLoggedIn: boolean;
    onReportSuccess: () => void;
}

export const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
        case 'beginner': return 'success';
        case 'intermediate': return 'warning';
        case 'advanced': return 'error';
        default: return 'default';
    }
};

export const getKickoutRiskLabel = (risk?: number) => {
    if (!risk) return null;
    if (risk <= 3) return { label: 'Low Risk', color: 'success' as const };
    if (risk <= 7) return { label: 'Medium Risk', color: 'warning' as const };
    return { label: 'High Risk', color: 'error' as const };
};

export const SpotInfo = ({ spot, isFavorited, onToggleFavorite, isLoggedIn, onReportSuccess }: SpotInfoProps) => {
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [displayAddress, setDisplayAddress] = useState<string | null>(null);
    const kickoutRisk = getKickoutRiskLabel(spot.kickout_risk);

    useEffect(() => {
        const buildAddress = async () => {

            // Priority 1: Use reverse geocoding if lat/lng available to get the most accurate address
            if (spot.latitude && spot.longitude) {
                const info = await reverseGeocode(spot.latitude, spot.longitude);

                // Build a clean address: "123 Street Name, City, State"
                const streetInfo = spot.address || [info.streetNumber, info.street].filter(Boolean).join(' ');
                const city = spot.city || info.city;
                const state = spot.state || info.state;
                const country = spot.country || info.country;

                const locationParts = [city, state].filter(Boolean).join(', ');
                const cleanAddress = [streetInfo, locationParts, country].filter(Boolean).join(', ');

                if (cleanAddress) {
                    setDisplayAddress(cleanAddress);
                    return;
                }
            }

            // Fallback: Use existing fields if available
            if (spot.address) {
                setDisplayAddress([
                    spot.address,
                    [spot.city, spot.state].filter(Boolean).join(', '),
                    spot.country
                ].filter(Boolean).join(', '));
                return;
            }

            // Priority 2: Use reverse geocoding if lat/lng available
            if (spot.latitude && spot.longitude) {
                const info = await reverseGeocode(spot.latitude, spot.longitude);

                // Build a clean address: "123 Street Name, City, State"
                const streetInfo = [info.streetNumber, info.street].filter(Boolean).join(' ');
                const locationParts = [info.city, info.state].filter(Boolean).join(', ');

                const cleanAddress = [streetInfo, locationParts, info.country].filter(Boolean).join(', ');

                if (cleanAddress) {
                    setDisplayAddress(cleanAddress);
                    return;
                }

                if (info.formattedAddress) {
                    setDisplayAddress(info.formattedAddress);
                    return;
                }
            }

            // Fallback: Just city/state/country from DB
            const locationParts = [spot.city, spot.state].filter(Boolean).join(', ');
            setDisplayAddress([
                locationParts,
                spot.country
            ].filter(Boolean).join(', ') || 'Unknown Location');
        };

        buildAddress();
    }, [spot.id, spot.address, spot.city, spot.state, spot.country, spot.latitude, spot.longitude]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `SpotHop - ${spot.name}`,
                    text: `Check out this spot: ${spot.name}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            {/* Spot Name and Address */}
            <Typography variant="h4" fontWeight={700} gutterBottom>
                {spot.name}
            </Typography>
            <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <LocationOnIcon color="action" />
                    <Typography variant="body1" color="text.secondary">
                        {displayAddress || 'Loading location...'}
                    </Typography>
                </Stack>

                {/* Social Actions Below Address */}
                <Stack direction="row" spacing={1} alignItems="center">
                    {isLoggedIn && (
                        <>
                            <Stack direction="row" alignItems="center">
                                <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                                    <IconButton onClick={onToggleFavorite} size="small">
                                        {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                                    </IconButton>
                                </Tooltip>
                                {(spot.favoriteCount ?? 0) > 0 && (
                                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: 'error.main' }}>
                                        {spot.favoriteCount}
                                    </Typography>
                                )}
                            </Stack>

                            <Stack direction="row" alignItems="center">
                                <Tooltip title="Report this spot">
                                    <IconButton onClick={() => setReportDialogOpen(true)} size="small">
                                        <FlagOutlined color={(spot.flagCount ?? 0) > 0 ? "error" : "action"} />
                                    </IconButton>
                                </Tooltip>
                                {(spot.flagCount ?? 0) > 0 && (
                                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: 'error.main' }}>
                                        {spot.flagCount}
                                    </Typography>
                                )}
                            </Stack>
                        </>
                    )}
                    <Tooltip title="Share spot">
                        <IconButton onClick={handleShare} size="small">
                            <Share />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <FlagSpotDialog
                spotId={spot.id}
                spotName={spot.name}
                open={reportDialogOpen}
                onClose={() => setReportDialogOpen(false)}
                onSuccess={onReportSuccess}
            />

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

            {/* Favorites Info */}
            {(spot.favoriteCount ?? 0) > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <FavoriteIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        <Typography variant="body2">
                            Saved by <strong>{spot.favoriteCount}</strong> {spot.favoriteCount === 1 ? 'user' : 'users'}
                            {spot.favoritedBy && spot.favoritedBy.length > 0 && (
                                <>: {spot.favoritedBy.map((username, idx) => (
                                    <span key={username}>
                                        <RouterLink
                                            to="/profile/$username"
                                            params={{ username }}
                                            style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
                                        >
                                            {username}
                                        </RouterLink>
                                        {idx < spot.favoritedBy!.length - 1 ? ', ' : ''}
                                    </span>
                                ))}</>
                            )}
                        </Typography>
                    </Stack>
                </Box>
            )}

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

            {/* What's Special Section */}
            {spot.spot_type && spot.spot_type.length > 0 && (
                <>
                    <Divider sx={{ my: 3 }} />
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
    );
};

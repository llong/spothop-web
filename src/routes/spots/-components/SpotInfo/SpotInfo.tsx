import { Paper, Typography, Box, Divider, Chip, Stack } from '@mui/material';
import { Skateboarding } from '@mui/icons-material';
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Link as RouterLink } from '@tanstack/react-router';
import { useState } from 'react';
import type { Spot } from 'src/types';
import { useSpotAddress } from 'src/hooks/useSpotAddress';
import { FlagSpotDialog } from '../FlagSpotDialog';
import { SpotSocialActions } from './SpotSocialActions';
import { SpotStats } from './SpotStats';
import { SpotAddress } from './SpotAddress';

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
    const { displayAddress } = useSpotAddress(spot);
    const kickoutRisk = getKickoutRiskLabel(spot.kickout_risk);

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
            <Typography variant="h4" fontWeight={700} gutterBottom>
                {spot.name}
            </Typography>

            <Box sx={{ mb: 2 }}>
                <SpotAddress displayAddress={displayAddress} />

                <SpotSocialActions
                    isLoggedIn={isLoggedIn}
                    isFavorited={isFavorited}
                    favoriteCount={spot.favoriteCount ?? 0}
                    flagCount={spot.flagCount ?? 0}
                    onToggleFavorite={onToggleFavorite}
                    onReportClick={() => setReportDialogOpen(true)}
                    onShareClick={handleShare}
                />
            </Box>

            <FlagSpotDialog
                spotId={spot.id}
                spotName={spot.name}
                open={reportDialogOpen}
                onClose={() => setReportDialogOpen(false)}
                onSuccess={onReportSuccess}
            />

            <SpotStats
                difficulty={spot.difficulty}
                kickoutRisk={spot.kickout_risk}
                isLit={spot.is_lit}
            />

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

            {/* Spot Features Chips */}
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

            {/* Spot Types Section */}
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

import { Paper, Typography, Stack, Box, Divider, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Skateboarding } from '@mui/icons-material';
import type { Spot } from 'src/types';

interface SpotInfoProps {
    spot: Spot;
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

export const SpotInfo = ({ spot }: SpotInfoProps) => {
    const kickoutRisk = getKickoutRiskLabel(spot.kickout_risk);

    return (
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
    );
};

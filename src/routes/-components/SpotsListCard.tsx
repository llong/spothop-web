import { Box, Card, CardActionArea, Chip, Stack, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router";
import type { Spot } from "src/types";
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const SpotsListCard: React.FC<{ spot: Spot }> = ({ spot }) => {
    // Format difficulty with color coding
    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner': return 'success';
            case 'intermediate': return 'warning';
            case 'advanced': return 'error';
            default: return 'default';
        }
    };

    // Format kickout risk
    const getKickoutRiskLabel = (risk?: number) => {
        if (!risk) return null;
        if (risk <= 3) return { label: 'Low Risk', color: 'success' as const };
        if (risk <= 7) return { label: 'Medium Risk', color: 'warning' as const };
        return { label: 'High Risk', color: 'error' as const };
    };

    const kickoutRisk = getKickoutRiskLabel(spot.kickout_risk);

    // Build location string
    const getLocationString = () => {
        if (spot.address) return spot.address;
        const parts = [spot.city, spot.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    };

    const locationString = getLocationString();

    // Check if we have any metadata to show
    const hasMetadata = spot.difficulty || kickoutRisk || (spot.spot_type && spot.spot_type.length > 0);

    return (
        <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', height: '100%' }}>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                    }
                }}
            >
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {/* Image Section */}
                    <Box
                        sx={{
                            width: '100%',
                            height: 200,
                            bgcolor: 'grey.300',
                            backgroundImage: spot.photoUrl ? `url(${spot.photoUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {!spot.photoUrl && (
                            <Typography variant="body2" color="text.secondary">
                                No Photo
                            </Typography>
                        )}
                        {/* Top-right badges */}
                        {spot.is_lit && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8
                                }}
                            >
                                <Chip
                                    icon={<LightModeIcon />}
                                    label="Lit"
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}
                                />
                            </Stack>
                        )}
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Address */}
                        {locationString && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 0.5 }}
                            >
                                {locationString}
                            </Typography>
                        )}

                        {/* Spot Name */}
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                fontWeight: 600,
                                mb: hasMetadata ? 1 : 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {spot.name}
                        </Typography>

                        {/* Spot Details - Only show if we have data */}
                        {(spot.difficulty || kickoutRisk) && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                                {spot.difficulty && (
                                    <Chip
                                        label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                        size="small"
                                        color={getDifficultyColor(spot.difficulty)}
                                        sx={{ fontWeight: 500 }}
                                    />
                                )}
                                {kickoutRisk && (
                                    <Chip
                                        icon={<WarningAmberIcon />}
                                        label={kickoutRisk.label}
                                        size="small"
                                        color={kickoutRisk.color}
                                        variant="outlined"
                                    />
                                )}
                            </Stack>
                        )}

                        {/* Spot Types - Only show if we have data */}
                        {spot.spot_type && spot.spot_type.length > 0 && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                            >
                                {spot.spot_type.join(' • ')}
                            </Typography>
                        )}

                        {/* Description - Only show if we have data */}
                        {spot.description && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    mt: 'auto'
                                }}
                            >
                                {spot.description}
                            </Typography>
                        )}
                    </Box>
                </CardActionArea>
            </Card>
        </Link>
    )
}

export default SpotsListCard;

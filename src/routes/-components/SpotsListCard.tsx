import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Stack, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router";
import type { Spot } from "src/types";
import LightModeIcon from '@mui/icons-material/LightMode';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState, useEffect, memo } from "react";
import { useGeocoding } from "src/hooks/useGeocoding";

const SpotsListCard: React.FC<{ spot: Spot; priority?: boolean }> = memo(({ spot, priority }) => {
    const [locationString, setLocationString] = useState<string>('Loading location...');
    const { buildLocationString } = useGeocoding();
    // Format difficulty with color coding
    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'beginner': return 'success';
            case 'intermediate': return 'warning'; // Note: theme needs darker warning text for contrast
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
    useEffect(() => {
        const buildLocation = async () => {
            const location = await buildLocationString(
                spot.address,
                spot.city,
                spot.country,
                spot.latitude,
                spot.longitude
            );
            setLocationString(location);
        };

        buildLocation();
    }, [spot.id, spot.address, spot.city, spot.country, spot.latitude, spot.longitude, buildLocationString]);

    return (
        <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
            <Card
                elevation={1}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                    }
                }}
            >
                <CardActionArea sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                        {spot.photoUrl ? (
                            <CardMedia
                                component="img"
                                image={spot.thumbnail_small_url || spot.thumbnail_large_url || spot.photoUrl || ''}
                                alt={spot.name}
                                loading={priority ? "eager" : "lazy"}
                                decoding="async"
                                {...(priority ? { fetchpriority: "high" } : {})}
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    bgcolor: 'grey.200',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">No Image</Typography>
                            </Box>
                        )}

                        {/* Overlays */}
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 1
                            }}
                        >
                            {spot.is_lit && (
                                <Chip
                                    icon={<LightModeIcon style={{ fontSize: 16 }} />}
                                    label="Lit"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                />
                            )}
                        </Stack>
                    </Box>

                    <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 500 }}
                        >
                            <LocationOnIcon sx={{ fontSize: 14 }} />
                            {locationString}
                        </Typography>

                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontWeight: 700,
                                lineHeight: 1.2,
                                mb: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {spot.name}
                        </Typography>

                        {/* Metadata Chips */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                            {spot.difficulty && (
                                <Chip
                                    label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                    size="small"
                                    color={getDifficultyColor(spot.difficulty)}
                                    variant="filled"
                                    sx={{
                                        fontWeight: 700,
                                        height: 24,
                                        fontSize: '0.75rem',
                                        // Improve contrast for warning/success colors
                                        color: spot.difficulty === 'intermediate' ? 'rgba(0,0,0,0.87)' : 'white'
                                    }}
                                />
                            )}
                            {kickoutRisk && (
                                <Chip
                                    icon={<WarningAmberIcon style={{ fontSize: 14 }} />}
                                    label={kickoutRisk.label}
                                    size="small"
                                    color={kickoutRisk.color}
                                    variant="outlined"
                                    sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }}
                                />
                            )}
                        </Stack>

                        {spot.spot_type && spot.spot_type.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                                {spot.spot_type.map(t => t.replace('_', ' ')).join(' • ')}
                            </Typography>
                        )}

                        {spot.description && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    mt: 'auto'
                                }}
                            >
                                {spot.description}
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Link>
    )
}, (prevProps, nextProps) => {
    return prevProps.spot.id === nextProps.spot.id &&
           prevProps.spot.updated_at === nextProps.spot.updated_at &&
           prevProps.priority === nextProps.priority;
});

export default SpotsListCard;

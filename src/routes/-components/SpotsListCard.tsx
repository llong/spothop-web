import { Box, Chip, Stack, Typography } from "@mui/material"
import { Link } from "@tanstack/react-router";
import type { Spot } from "src/types";
import LightModeIcon from '@mui/icons-material/LightMode';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import FlagIcon from '@mui/icons-material/Flag';
import { useState, useEffect, memo, useMemo } from "react";
import { useGeocoding } from "src/hooks/useGeocoding";
import { getOptimizedImageUrl } from "src/utils/imageOptimization";

const SpotsListCard: React.FC<{ spot: Spot; priority?: boolean }> = memo(({ spot, priority }) => {
    const [locationString, setLocationString] = useState<string>('Loading location...');
    const { buildLocationString } = useGeocoding();

    // Format kickout risk
    const kickoutRiskLabel = useMemo(() => {
        const risk = spot.kickout_risk;
        if (!risk) return 'Low Risk';
        if (risk <= 3) return 'Low Risk';
        if (risk <= 7) return 'Med Risk';
        return 'High Risk';
    }, [spot.kickout_risk]);

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
        <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', display: 'block' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: 'background.paper',
                    '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.01)',
                        borderColor: 'primary.main',
                    }
                }}
            >
                <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                    {spot.photoUrl ? (
                        <Box
                            component="img"
                            src={getOptimizedImageUrl(spot.thumbnail_small_url || spot.thumbnail_large_url || spot.photoUrl || '')}
                            alt={spot.name}
                            loading={priority ? "eager" : "lazy"}
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
                                bgcolor: 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">No Image</Typography>
                        </Box>
                    )}

                    {/* Top Overlays */}
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1
                        }}
                    >
                        {spot.is_lit && (
                            <Chip
                                icon={<LightModeIcon style={{ fontSize: 14, color: '#FFD700' }} />}
                                label="LIT"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 1,
                                    height: 20,
                                    '& .MuiChip-icon': { ml: 0.5, mr: -0.5 }
                                }}
                            />
                        )}
                    </Stack>

                    {/* Bottom Stats Overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 1.5,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            display: 'flex',
                            gap: 2,
                            color: 'white'
                        }}
                    >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <FavoriteIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={800}>{spot.favoriteCount || 0}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <ChatBubbleIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" fontWeight={800}>{spot.commentCount || 0}</Typography>
                        </Stack>
                    </Box>
                </Box>

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}
                        >
                            <LocationOnIcon sx={{ fontSize: 12 }} />
                            {locationString}
                        </Typography>

                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontWeight: 800,
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                fontSize: '1.1rem',
                                color: 'text.primary'
                            }}
                        >
                            {spot.name}
                        </Typography>
                    </Box>

                    {/* Metadata Row */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        {spot.difficulty && (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                                <FitnessCenterIcon sx={{ fontSize: 14, color: 'grey.600' }} />
                                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {spot.difficulty}
                                </Typography>
                            </Stack>
                        )}
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                            <LocalPoliceIcon sx={{ fontSize: 14, color: 'grey.600' }} />
                            <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                {kickoutRiskLabel}
                            </Typography>
                        </Stack>
                        
                        {spot.spot_type && spot.spot_type.length > 0 && (
                            <Typography variant="caption" color="text.disabled" fontWeight={800} sx={{ fontSize: '0.65rem' }}>
                                • {spot.spot_type[0].replace('_', ' ').toUpperCase()}
                            </Typography>
                        )}
                    </Stack>

                    {spot.description && (
                        <Typography
                            variant="body2"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontSize: '0.8125rem',
                                lineHeight: 1.4,
                                color: 'text.secondary',
                                mb: 0.5
                            }}
                        >
                            {spot.description}
                        </Typography>
                    )}

                    {/* Subtle Flag Indicator */}
                    {(spot.name.toLowerCase().includes('test') || spot.description?.toLowerCase().includes('not a real spot')) && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'error.main', opacity: 0.7 }}>
                            <FlagIcon sx={{ fontSize: 12 }} />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                not a real spot
                            </Typography>
                        </Stack>
                    )}
                </Box>
            </Box>
        </Link>
    )
}, (prevProps, nextProps) => {
    return prevProps.spot.id === nextProps.spot.id &&
        prevProps.spot.updated_at === nextProps.spot.updated_at &&
        prevProps.priority === nextProps.priority;
});

export default SpotsListCard;
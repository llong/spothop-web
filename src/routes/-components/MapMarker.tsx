import { memo, Suspense, useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import { Box, Typography, Stack } from "@mui/material";
import type { Spot } from "src/types";
import { getOptimizedImageUrl } from "src/utils/imageOptimization";
import { useNavigate } from "@tanstack/react-router";
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useGeocoding } from "src/hooks/useGeocoding";

interface MapMarkerProps {
    spot: Spot;
    onClick?: () => void;
}

export const MapMarker = memo(({ spot, onClick }: MapMarkerProps) => {
    const navigate = useNavigate();
    const [locationString, setLocationString] = useState<string>(spot.city || 'Loading location...');
    const { buildLocationString } = useGeocoding();

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
    }, [spot.address, spot.city, spot.country, spot.latitude, spot.longitude, buildLocationString]);

    return (
        <Suspense fallback={null}>
            <Marker
                position={[spot.latitude, spot.longitude]}
                eventHandlers={{
                    click: onClick,
                }}
            >
                <Popup closeButton={false} autoPan={false}>
                    <Box
                        sx={{ cursor: "pointer", minWidth: 220, p: 0.5 }}
                        onClick={() => navigate({ to: "/spots/$spotId", params: { spotId: spot.id.toString() } })}
                    >
                        {spot.photoUrl && (
                            <Box
                                component="img"
                                src={getOptimizedImageUrl(spot.photoUrl)}
                                alt={spot.name}
                                crossOrigin="anonymous"
                                sx={{
                                    width: "100%",
                                    height: 120,
                                    borderRadius: 1.5,
                                    objectFit: 'cover',
                                    mb: 1.5
                                }}
                            />
                        )}
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}
                        >
                            <LocationOnIcon sx={{ fontSize: 12 }} />
                            {locationString}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 1, color: "text.primary", fontSize: '1.05rem' }}>
                            {spot.name}
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                                <FitnessCenterIcon sx={{ fontSize: 14, color: 'grey.600' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                    {spot.difficulty}
                                </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                                <LocalPoliceIcon sx={{ fontSize: 14, color: 'grey.600' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                    {(spot.kickout_risk || 0) <= 3 ? 'Low' : (spot.kickout_risk || 0) <= 7 ? 'Med' : 'High'}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Popup>
            </Marker>
        </Suspense>
    );
});

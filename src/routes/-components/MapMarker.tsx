import { memo, Suspense, useState, useEffect, useMemo } from "react";
import { divIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Box, Typography, Stack } from "@mui/material";
import type { Spot } from "@/types";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { useNavigate } from "@tanstack/react-router";
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useGeocoding } from "@/hooks/useGeocoding";

interface MapMarkerProps {
    spot: Spot;
    onClick?: () => void;
}

const PIN_SIZE = 44;

/** A round photo pin; spots without a pin thumbnail yet keep Leaflet's default marker. */
const photoPinIcon = (url: string) => {
    const pin = document.createElement('div');
    pin.style.cssText = `width:${PIN_SIZE}px;height:${PIN_SIZE}px;border-radius:50%;border:3px solid #fff;` +
        'box-shadow:0 2px 6px rgba(0,0,0,.45);background:#ddd center/cover no-repeat;box-sizing:border-box';
    pin.style.backgroundImage = `url("${encodeURI(url)}")`;
    return divIcon({
        html: pin,
        className: '', // drop Leaflet's default white square
        iconSize: [PIN_SIZE, PIN_SIZE],
        iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
        popupAnchor: [0, -PIN_SIZE / 2],
    });
};

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

    const icon = useMemo(
        () => (spot.thumbnail_pin_url ? photoPinIcon(spot.thumbnail_pin_url) : undefined),
        [spot.thumbnail_pin_url]
    );

    return (
        <Suspense fallback={null}>
            <Marker
                position={[spot.latitude, spot.longitude]}
                // an explicit `icon: undefined` would override Leaflet's default marker
                {...(icon && { icon })}
                eventHandlers={{
                    click: onClick,
                }}
            >
                <Popup className="spot-popup" closeButton={false} autoPan={false}>
                    <Box
                        sx={{ 
                            cursor: "pointer", 
                            minWidth: 220, 
                            p: 1.5,
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            borderRadius: 2,
                            boxShadow: 4
                        }}
                        onClick={() => navigate({ to: "/spots/$spotId", params: { spotId: spot.id.toString() } })}
                    >
                        {spot.photoUrl && (
                            <Box
                                component="img"
                                src={getOptimizedImageUrl(spot.thumbnail_large_url || spot.thumbnail_small_url || spot.photoUrl)}
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

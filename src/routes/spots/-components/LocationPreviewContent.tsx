import { Box, Paper, Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useEffect } from 'react';

interface LocationPreviewContentProps {
    lat: number;
    lng: number;
    address: string;
}

const LocationPreviewContent = ({ lat, lng, address }: LocationPreviewContentProps) => {
    // Lazy load the CSS only when the map component mounts
    useEffect(() => {
        import('leaflet/dist/leaflet.css');
    }, []);

    return (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: 240, width: '100%', position: 'relative' }}>
                <MapContainer
                    center={[lat, lng]}
                    zoom={17}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[lat, lng]} />
                </MapContainer>
            </Box>
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <LocationOnIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="subtitle2" fontWeight="bold">Location</Typography>
                        <Typography variant="body2" color="text.secondary">{address || 'Fetching address...'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                        </Typography>
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
};

export default LocationPreviewContent;

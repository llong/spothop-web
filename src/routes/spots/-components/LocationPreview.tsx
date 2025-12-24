import { Box, Paper, Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure CSS is imported if needed, or rely on global styles

interface LocationPreviewProps {
    lat: number;
    lng: number;
    address: string;
}

export const LocationPreview = ({ lat, lng, address }: LocationPreviewProps) => {
    return (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ height: 240, width: '100%', position: 'relative' }}>
                {/* 
                    Note: react-leaflet MapContainer needs a fixed height.
                    We use a key to force re-render if lat/lng changes significantly if needed, 
                    though MapContainer handles center updates if configured correctly.
                    Here we just pass center.
                */}
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

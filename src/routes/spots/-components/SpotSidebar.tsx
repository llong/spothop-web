import { Paper, Typography, Divider, Stack, Button } from '@mui/material';
import { Favorite, FavoriteBorder, AddPhotoAlternate, Directions } from '@mui/icons-material';
import type { Spot } from '../../../types'

interface SpotSidebarProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onAddMedia: () => void;
    isLoggedIn: boolean;
}

export const SpotSidebar = ({ spot, isFavorited, onToggleFavorite, onAddMedia, isLoggedIn }: SpotSidebarProps) => {
    const handleOpenInMaps = () => {
        const { latitude, longitude, name, address } = spot;
        const query = encodeURIComponent(`${name || 'Spot'} ${address || ''}`);

        // Use apple maps on iOS devices if possible, otherwise google maps
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS
            ? `maps://?q=${query}&ll=${latitude},${longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

        window.open(url, '_blank');
    };

    return (
        <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>

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

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
                <Button
                    variant="contained"
                    fullWidth
                    color="secondary"
                    size="large"
                    onClick={handleOpenInMaps}
                    startIcon={<Directions />}
                    sx={{ mb: 1 }}
                >
                    Get Directions
                </Button>

                {isLoggedIn && (
                    <>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={onToggleFavorite}
                            startIcon={isFavorited ? <Favorite /> : <FavoriteBorder />}
                        >
                            {isFavorited ? 'Saved' : 'Save Spot'}
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            onClick={onAddMedia}
                            startIcon={<AddPhotoAlternate />}
                        >
                            Add Photo/Video
                        </Button>
                    </>
                )}
            </Stack>
        </Paper>
    );
};

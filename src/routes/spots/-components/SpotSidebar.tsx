import { Paper, Typography, Divider, Stack, Button } from '@mui/material';
import { Favorite, FavoriteBorder, AddPhotoAlternate } from '@mui/icons-material';
import type { Spot } from '../../../types'

interface SpotSidebarProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onAddMedia: () => void;
    isLoggedIn: boolean;
}

export const SpotSidebar = ({ spot, isFavorited, onToggleFavorite, onAddMedia, isLoggedIn }: SpotSidebarProps) => {
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

            {isLoggedIn && (
                <>
                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1}>
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
                    </Stack>
                </>
            )}
        </Paper>
    );
};

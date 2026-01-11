import { Stack, Button } from '@mui/material';
import { Favorite, FavoriteBorder, AddPhotoAlternate, Directions } from '@mui/icons-material';

interface SidebarActionsProps {
    isLoggedIn: boolean;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onAddMedia: () => void;
    onDirectionsClick: () => void;
}

export const SidebarActions = ({
    isLoggedIn,
    isFavorited,
    onToggleFavorite,
    onAddMedia,
    onDirectionsClick
}: SidebarActionsProps) => {
    return (
        <Stack spacing={1}>
            <Button
                variant="contained"
                fullWidth
                color="secondary"
                size="large"
                onClick={onDirectionsClick}
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
    );
};

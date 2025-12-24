import { Paper, Typography, Divider, Stack, Box, Button } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import type { Spot } from '../../../types'

interface SpotSidebarProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    isLoggedIn: boolean;
}

export const SpotSidebar = ({ spot, isFavorited, onToggleFavorite, isLoggedIn }: SpotSidebarProps) => {
    return (
        <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Spot Details
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
                {spot.difficulty && (
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Difficulty Level
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                        </Typography>
                    </Box>
                )}

                {spot.is_lit !== undefined && (
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Lighting
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {spot.is_lit ? 'Lit at night' : 'Not lit'}
                        </Typography>
                    </Box>
                )}

                {spot.kickout_risk !== undefined && (
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Kickout Risk
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {spot.kickout_risk}/10
                        </Typography>
                    </Box>
                )}

                {spot.spot_type && spot.spot_type.length > 0 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Features
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {spot.spot_type.join(', ')}
                        </Typography>
                    </Box>
                )}
            </Stack>

            {isLoggedIn && (
                <>
                    <Divider sx={{ my: 2 }} />

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={onToggleFavorite}
                        startIcon={isFavorited ? <Favorite /> : <FavoriteBorder />}
                    >
                        {isFavorited ? 'Saved' : 'Save Spot'}
                    </Button>
                </>
            )}
        </Paper>
    );
};

import { Box, Container, Stack, Button, IconButton } from '@mui/material';
import { ArrowBack, Favorite, FavoriteBorder, Share } from '@mui/icons-material';

interface SpotHeaderProps {
    onBack: () => void;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    isLoggedIn: boolean;
}

export const SpotHeader = ({ onBack, isFavorited, onToggleFavorite, isLoggedIn }: SpotHeaderProps) => {
    return (
        <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2 }}>
            <Container maxWidth="lg">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={onBack}
                        sx={{ color: 'text.primary' }}
                    >
                        Back to search
                    </Button>
                    <Stack direction="row" spacing={1}>
                        {isLoggedIn && (
                            <IconButton onClick={onToggleFavorite}>
                                {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                            </IconButton>
                        )}
                        <IconButton>
                            <Share />
                        </IconButton>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

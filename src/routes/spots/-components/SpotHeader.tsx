import { Box, Container, Stack, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { ArrowBack, Favorite, FavoriteBorder, Share, FlagOutlined } from '@mui/icons-material';
import { useState } from 'react';
import { FlagSpotDialog } from './FlagSpotDialog';

interface SpotHeaderProps {
    spotId: string;
    spotName: string;
    onBack: () => void;
    isFavorited: boolean;
    favoriteCount?: number;
    flagCount?: number;
    onToggleFavorite: () => void;
    isLoggedIn: boolean;
    onReportSuccess: () => void;
}

export const SpotHeader = ({
    spotId,
    spotName,
    onBack,
    isFavorited,
    favoriteCount = 0,
    flagCount = 0,
    onToggleFavorite,
    isLoggedIn,
    onReportSuccess
}: SpotHeaderProps) => {
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

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
                    <Stack direction="row" spacing={1} alignItems="center">
                        {isLoggedIn && (
                            <>
                                <Stack direction="row" alignItems="center">
                                    {favoriteCount > 0 && (
                                        <Typography variant="body2" sx={{ mr: -0.5, fontWeight: 600, color: 'error.main' }}>
                                            {favoriteCount}
                                        </Typography>
                                    )}
                                    <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                                        <IconButton onClick={onToggleFavorite}>
                                            {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                                        </IconButton>
                                    </Tooltip>
                                </Stack>

                                <Stack direction="row" alignItems="center">
                                    {flagCount > 0 && (
                                        <Typography variant="body2" sx={{ mr: -0.5, fontWeight: 600, color: 'error.main' }}>
                                            {flagCount}
                                        </Typography>
                                    )}
                                    <Tooltip title="Report this spot">
                                        <IconButton onClick={() => setReportDialogOpen(true)}>
                                            <FlagOutlined color={flagCount > 0 ? "error" : "action"} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </>
                        )}
                        <IconButton>
                            <Share />
                        </IconButton>
                    </Stack>
                </Stack>
            </Container>

            <FlagSpotDialog
                spotId={spotId}
                spotName={spotName}
                open={reportDialogOpen}
                onClose={() => setReportDialogOpen(false)}
                onSuccess={onReportSuccess}
            />
        </Box>
    );
};

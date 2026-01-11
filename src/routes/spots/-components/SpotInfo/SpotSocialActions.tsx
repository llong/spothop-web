import { Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder, FlagOutlined, Share } from '@mui/icons-material';

interface SpotSocialActionsProps {
    isLoggedIn: boolean;
    isFavorited: boolean;
    favoriteCount: number;
    flagCount: number;
    onToggleFavorite: () => void;
    onReportClick: () => void;
    onShareClick: () => void;
}

export const SpotSocialActions = ({
    isLoggedIn,
    isFavorited,
    favoriteCount,
    flagCount,
    onToggleFavorite,
    onReportClick,
    onShareClick
}: SpotSocialActionsProps) => {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {isLoggedIn && (
                <>
                    <Stack direction="row" alignItems="center">
                        <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"}>
                            <IconButton onClick={onToggleFavorite} size="small">
                                {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                            </IconButton>
                        </Tooltip>
                        {favoriteCount > 0 && (
                            <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: 'error.main' }}>
                                {favoriteCount}
                            </Typography>
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center">
                        <Tooltip title="Report this spot">
                            <IconButton onClick={onReportClick} size="small">
                                <FlagOutlined color={flagCount > 0 ? "error" : "action"} />
                            </IconButton>
                        </Tooltip>
                        {flagCount > 0 && (
                            <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, color: 'error.main' }}>
                                {flagCount}
                            </Typography>
                        )}
                    </Stack>
                </>
            )}
            <Tooltip title="Share spot">
                <IconButton onClick={onShareClick} size="small">
                    <Share />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

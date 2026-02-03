import {
    Stack,
    Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import type { Spot } from 'src/types';

interface DetailsActionsProps {
    spot: Spot;
    isFavorited: boolean;
    onToggleFavorite: () => void;
    onOpenComments: () => void;
    onShare: () => void;
    onFlag: () => void;
}

export const DetailsActions = ({ spot, isFavorited, onToggleFavorite, onOpenComments, onShare, onFlag }: DetailsActionsProps) => {
    return (
        <Stack direction="row" spacing={3} alignItems="center" sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: isFavorited ? 'primary.main' : 'text.secondary', cursor: 'pointer' }} onClick={onToggleFavorite}>
                {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                <Typography variant="body2" fontWeight={600}>
                    {(spot.favoriteCount || 0) + (isFavorited && !spot.isFavorited ? 1 : !isFavorited && spot.isFavorited ? -1 : 0)}
                </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', cursor: 'pointer' }} onClick={onOpenComments}>
                <ChatBubbleOutlineIcon />
                <Typography variant="body2" fontWeight={600}>{spot.commentCount || 0}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', cursor: 'pointer' }} onClick={onShare}>
                <ShareIcon />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', cursor: 'pointer' }} onClick={onFlag}>
                <FlagIcon />
                {(spot.flagCount || 0) > 0 && <Typography variant="body2" fontWeight={600}>{spot.flagCount}</Typography>}
            </Stack>
        </Stack>
    );
};
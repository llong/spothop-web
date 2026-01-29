import { memo, useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Avatar,
    IconButton,
    Typography,
    Stack,
    Chip,
    Button
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem as FeedItemType } from 'src/types';
import { useToggleMediaLike, useToggleFollow } from 'src/hooks/useFeedQueries';
import { useSpotFavorites } from 'src/hooks/useSpotFavorites';
import { FeedCommentDialog } from './FeedCommentDialog';
import { MediaCarousel } from 'src/routes/spots/-components/MediaCarousel';

interface FeedItemCardProps {
    item: FeedItemType;
    currentUserId?: string;
}

/**
 * FeedItemCard displays a single item in the global feed.
 * Renamed to avoid collision with the FeedItem type from src/types.
 */
export const FeedItemCard = memo(({ item, currentUserId }: FeedItemCardProps) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const toggleLikeMutation = useToggleMediaLike();
    const toggleFollowMutation = useToggleFollow();

    // Convert single feed item media to array for carousel
    const media = useMemo(() => [{
        id: item.media_id,
        url: item.media_url,
        type: item.media_type,
        thumbnailUrl: item.thumbnail_url,
        createdAt: item.created_at,
        author: {
            id: item.uploader_id,
            username: item.uploader_username,
            avatarUrl: item.uploader_avatar_url
        },
        likeCount: item.like_count,
        isLiked: item.is_liked_by_user || false
    }], [item]);

    // Minimal spot object for useSpotFavorites
    const spot = useMemo(() => ({
        id: item.spot_id,
        name: item.spot_name,
        isFavorited: item.is_favorited_by_user,
        latitude: 0,
        longitude: 0,
        description: ''
    }), [item.spot_id, item.spot_name, item.is_favorited_by_user]);

    const { toggleFavorite } = useSpotFavorites(spot, currentUserId);

    const handleLike = () => {
        toggleLikeMutation.mutate({
            mediaId: item.media_id,
            mediaType: item.media_type
        });
    };

    const handleFavorite = () => {
        toggleFavorite();
    };

    const handleFollow = () => {
        toggleFollowMutation.mutate(item.uploader_id);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: item.spot_name,
                text: `Check out this spot: ${item.spot_name}`,
                url: window.location.origin + `/spots/${item.spot_id}`
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.origin + `/spots/${item.spot_id}`);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <Card
            elevation={2}
            sx={{
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
                borderRadius: 4,
                overflow: 'hidden'
            }}
        >
            <CardHeader
                avatar={
                    <Link to="/profile/$username" params={{ username: item.uploader_username || '' }}>
                        <Avatar src={item.uploader_avatar_url || undefined} sx={{ cursor: 'pointer' }} />
                    </Link>
                }
                action={
                    currentUserId && currentUserId !== item.uploader_id && (
                        <Button
                            size="small"
                            onClick={handleFollow}
                            variant={item.is_followed_by_user ? "outlined" : "contained"}
                            sx={{ borderRadius: 10, px: 2 }}
                            disabled={toggleFollowMutation.isPending}
                        >
                            {item.is_followed_by_user ? 'Unfollow' : 'Follow'}
                        </Button>
                    )
                }
                title={
                    <Link
                        to="/profile/$username"
                        params={{ username: item.uploader_username || '' }}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        @{item.uploader_username}
                    </Link>
                }
                subheader={formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            />

            <MediaCarousel
                media={media}
                activeSlide={activeSlide}
                onSlideChange={setActiveSlide}
            />

            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Link
                            to="/spots/$spotId"
                            params={{ spotId: item.spot_id }}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <Typography variant="h6" fontWeight={700} sx={{ '&:hover': { color: 'primary.main' } }}>
                                {item.spot_name}
                            </Typography>
                        </Link>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="small" />
                            {item.city}{item.city && item.country ? ', ' : ''}{item.country}
                        </Typography>
                    </Box>
                    <Chip
                        label={item.media_type.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 700 }}
                    />
                </Stack>
            </CardContent>

            <CardActions disableSpacing sx={{ px: 2, pb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={handleLike} color={item.is_liked_by_user ? "error" : "default"}>
                        {item.is_liked_by_user ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <Typography variant="body2" fontWeight={600}>
                        {item.like_count}
                    </Typography>

                    <IconButton onClick={() => setCommentDialogOpen(true)}>
                        <ChatBubbleOutlineIcon />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600}>
                        {item.comment_count}
                    </Typography>

                    <IconButton onClick={handleShare}>
                        <ShareIcon />
                    </IconButton>
                </Stack>

                <Box sx={{ flexGrow: 1 }} />

                <IconButton onClick={handleFavorite} color={item.is_favorited_by_user ? "primary" : "default"}>
                    {item.is_favorited_by_user ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
            </CardActions>

            <FeedCommentDialog
                open={commentDialogOpen}
                onClose={() => setCommentDialogOpen(false)}
                item={item}
                userId={currentUserId}
            />
        </Card>
    );
});

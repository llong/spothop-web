import { memo, useState, useMemo, useCallback, type FC } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/atoms/auth';
import {
    Box,
    Avatar,
    IconButton,
    Typography,
    Stack,
    Button,
    Divider
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link, useNavigate } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem as FeedItemType } from '@/types';
import { useToggleFollow } from '@/hooks/useFeedQueries';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useSpotFavorites } from '@/hooks/useSpotFavorites';
import { MediaCarousel } from '@/routes/spots/-components/MediaCarousel';
import React from 'react';

const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // If it's a supabase storage path (e.g. "avatars/xyz.webp")
    if (path.includes('/') && !path.includes('storage/v1')) {
         // Handle both possible path types: "avatars/xyz.webp" and "spot-media/spots/xyz/..."
         const cleanPath = path.startsWith('/') ? path.substring(1) : path;
         return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
    }
    return path;
};

interface FeedItemCardProps {
    /** One upload's media (same spot and user), oldest first. Shown as a carousel when there are several. */
    items: FeedItemType[];
    onCommentClick?: (item: FeedItemType) => void;
}

/** Feed rows are one photo/video each; the carousel wants MediaItems. */
const toMediaItem = (item: FeedItemType): import('@/types').MediaItem => ({
    id: item.media_id,
    // Photos: render the 800px thumbnail in the feed (falls back to the original if missing)
    url: getFullUrl(item.media_type === 'photo' ? (item.thumbnail_url || item.media_url) : item.media_url),
    type: item.media_type,
    thumbnailUrl: item.thumbnail_url ? getFullUrl(item.thumbnail_url) : undefined,
} as import('@/types').MediaItem);

/**
 * FeedItemCard displays one post in the feed: a spot with the media a user uploaded to it.
 * Redesigned for a flat, modern X-style layout. Likes/comments belong to each photo or video,
 * so the comment button acts on the slide currently shown.
 */
export const FeedItemCard: FC<FeedItemCardProps> = memo(({ items, onCommentClick }) => {
    const item = items[0]; // spot, uploader and time are shared by the whole post
    const auth = useAtomValue(userAtom);
    const currentUserId = auth?.user?.id;
    const [activeSlide, setActiveSlide] = useState(0);
    // Lifted video play state — survives Virtuoso remounts when scrolling
    const [showVideo, setShowVideo] = useState(false);
    const handleShowVideo = useCallback(() => setShowVideo(true), []);
    const handleSlideChange = useCallback((index: number) => {
        setActiveSlide(index);
        setShowVideo(false); // a video only plays on the slide it was started on
    }, []);
    const activeItem = items[Math.min(activeSlide, items.length - 1)];
    const toggleFollowMutation = useToggleFollow();
    const navigate = useNavigate();

    const media = useMemo(() => items.map(toMediaItem), [items]);

    // Minimal spot object for useSpotFavorites
    const spot = useMemo(() => ({
        id: item.spot_id,
        name: item.spot_name,
        isFavorited: item.is_favorited_by_user,
        favoriteCount: item.favorite_count,
        latitude: 0,
        longitude: 0,
        description: ''
    }), [item.spot_id, item.spot_name, item.is_favorited_by_user, item.favorite_count]);

    const { isFavorited, favoriteCount, toggleFavorite } = useSpotFavorites(spot, currentUserId, item.favorite_count);

    const handleFavorite = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUserId) {
            navigate({ to: '/signup' });
            return;
        }
        toggleFavorite();
    }, [toggleFavorite, currentUserId, navigate]);

    const handleFollow = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFollowMutation.mutate(item.uploader_id);
    }, [item.uploader_id, toggleFollowMutation]);

    const handleShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const url = window.location.origin + `/spots/${item.spot_id}`;
        if (navigator.share) {
            navigator.share({
                title: item.spot_name,
                text: `Check out this spot: ${item.spot_name}`,
                url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            // We'll assume the user can see console or we have a better way to toast later
            console.log('Link copied to clipboard');
        }
    }, [item.spot_name, item.spot_id]);


    return (
        <Box
            sx={{
                width: '100%',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.01)',
                    transition: 'background-color 0.2s'
                }
            }}
        >
            {/* Header Row: User Info & Follow Button */}
            <Box sx={{ display: 'flex', px: 2, pt: 1.5, pb: 1, gap: 1.5, alignItems: 'center' }}>
                <Link to="/profile/$username" params={{ username: item.uploader_username || '' }}>
                    <Avatar 
                        sx={{ cursor: 'pointer', width: 40, height: 40, bgcolor: 'transparent', '& img': { border: 'none' } }}
                    >
                        <OptimizedImage
                            src={getFullUrl(item.uploader_avatar_url || '')}
                            alt={item.uploader_username || 'user'}
                        />
                    </Avatar>
                </Link>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ minWidth: 0, flexShrink: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Link
                                    to="/profile/$username"
                                    params={{ username: item.uploader_username || '' }}
                                    style={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                                >
                                    <Typography noWrap variant="subtitle1" fontWeight={700} sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                        {item.uploader_display_name || item.uploader_username}
                                    </Typography>
                                </Link>
                                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                    · {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
                                @{item.uploader_username}
                            </Typography>
                        </Box>

                        {currentUserId && currentUserId !== item.uploader_id && (
                            <Button
                                size="small"
                                onClick={handleFollow}
                                variant={item.is_followed_by_user ? "outlined" : "contained"}
                                sx={{
                                    borderRadius: 9999,
                                    px: 2,
                                    height: 28,
                                    minWidth: 0,
                                    fontSize: '0.75rem',
                                    bgcolor: item.is_followed_by_user ? 'transparent' : 'black',
                                    color: item.is_followed_by_user ? 'black' : 'white',
                                    borderColor: item.is_followed_by_user ? 'divider' : 'black',
                                    '&:hover': {
                                        bgcolor: item.is_followed_by_user ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.8)',
                                        borderColor: item.is_followed_by_user ? 'error.light' : 'black',
                                        color: item.is_followed_by_user ? 'error.main' : 'white',
                                    }
                                }}
                                disabled={toggleFollowMutation.isPending}
                            >
                                {item.is_followed_by_user ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Box>

            <Divider sx={{ ml: 2, mr: 2, mb: 1, mt: 0.5 }} />

            {/* Content Row: Text & Location */}
            <Box sx={{ px: 2, pb: 1.5, pt: 1 }}>
                <Link
                    to="/spots/$spotId"
                    params={{ spotId: item.spot_id }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.3 }}>
                        Found a spot: <Box component="span" sx={{ fontWeight: 700, color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>{item.spot_name}</Box>
                    </Typography>
                </Link>

                {item.city && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                    </Typography>
                )}
            </Box>

            {/* Media Row: Flush with padding */}
            <Box sx={{ px: 2, pb: 1.5 }}>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <MediaCarousel
                        media={media}
                        activeSlide={activeSlide}
                        onSlideChange={handleSlideChange}
                        showVideo={showVideo}
                        onShowVideo={handleShowVideo}
                    />
                </Box>
            </Box>

            {/* Actions Row */}
            <Box sx={{ px: 2, pb: 1.5 }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ width: '100%' }}>
                    {/* Favorite (Spot) */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: isFavorited ? 'error.main' : 'text.secondary' }}>
                        <IconButton
                            size="small"
                            onClick={handleFavorite}
                            color={isFavorited ? "error" : "default"}
                            sx={{ '&:hover': { bgcolor: 'rgba(249, 24, 128, 0.1)' } }}
                        >
                            {isFavorited ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                        <Typography variant="caption" fontWeight={500}>
                            {favoriteCount}
                        </Typography>
                    </Stack>

                    {/* Comment */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                        <IconButton
                            size="small"
                            onClick={() => onCommentClick?.(activeItem)}
                            sx={{ '&:hover': { color: 'primary.main', bgcolor: 'rgba(29, 155, 240, 0.1)' } }}
                        >
                            <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" fontWeight={500}>
                            {activeItem.comment_count}
                        </Typography>
                    </Stack>

                    {/* Share */}
                    <IconButton
                        size="small"
                        onClick={handleShare}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'rgba(29, 155, 240, 0.1)' } }}
                    >
                        <ShareIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>

        </Box>
    );
}, (prev, next) =>
    prev.onCommentClick === next.onCommentClick &&
    prev.items.length === next.items.length &&
    prev.items.every((item, i) => item === next.items[i]));

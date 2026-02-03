import { memo, useState, useMemo, useCallback } from 'react';
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
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem as FeedItemType } from 'src/types';
import { useToggleFollow } from 'src/hooks/useFeedQueries';
import { useSpotFavorites } from 'src/hooks/useSpotFavorites';
import { FeedCommentDialog } from './FeedCommentDialog';
import { MediaCarousel } from 'src/routes/spots/-components/MediaCarousel';
import React from 'react';

interface FeedItemCardProps {
    item: FeedItemType;
    currentUserId?: string;
}

/**
 * FeedItemCard displays a single item in the global feed.
 * Redesigned for a flat, modern X-style layout.
 */
export const FeedItemCard = memo(({ item, currentUserId }: FeedItemCardProps) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
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

    const { isFavorited, toggleFavorite } = useSpotFavorites(spot, currentUserId);

    const handleFavorite = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite();
    }, [toggleFavorite]);

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
                    <Avatar src={item.uploader_avatar_url || undefined} sx={{ cursor: 'pointer', width: 40, height: 40 }} />
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
                        {item.city}{item.city && item.country ? ', ' : ''}{item.country}
                    </Typography>
                )}
            </Box>

            {/* Media Row: Flush with padding */}
            <Box sx={{ px: 2, pb: 1.5 }}>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <MediaCarousel
                        media={media}
                        activeSlide={activeSlide}
                        onSlideChange={setActiveSlide}
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
                    </Stack>

                    {/* Comment */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                        <IconButton
                            size="small"
                            onClick={() => setCommentDialogOpen(true)}
                            sx={{ '&:hover': { color: 'primary.main', bgcolor: 'rgba(29, 155, 240, 0.1)' } }}
                        >
                            <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" fontWeight={500}>
                            {item.comment_count}
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

            <FeedCommentDialog
                open={commentDialogOpen}
                onClose={() => setCommentDialogOpen(false)}
                item={item}
                userId={currentUserId}
            />
        </Box>
    );
});
import { memo } from 'react';
import { Box, Avatar, Typography, Stack, IconButton, Button, Divider } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import type { MediaItem } from 'src/types';
import { getOptimizedImageUrl } from 'src/utils/imageOptimization';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import React from 'react';
import { useToggleFollow } from 'src/hooks/useFeedQueries';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { useAdminQueries } from 'src/hooks/useAdminQueries';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface MediaListItemProps {
    item: MediaItem;
    currentUserId?: string;
    onLike: (mediaId: string, mediaType: 'photo' | 'video') => void;
    onComment: (item: MediaItem) => void;
    onShare: (item: MediaItem) => void;
    onClick: () => void;
}

export const MediaListItem = memo(({ item, currentUserId, onLike, onComment, onShare, onClick }: MediaListItemProps) => {
    const { data: profile } = useProfileQuery(currentUserId);
    const { deleteContent, isActioning } = useAdminQueries();
    const isAdmin = profile?.role === 'admin';
    const toggleFollowMutation = useToggleFollow();

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFollowMutation.mutate(item.author.id);
    };

    const handleDeleteMedia = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('ADMIN: Are you sure you want to delete this media item?')) {
            await deleteContent({ type: 'media', id: item.id });
            window.location.reload();
        }
    };

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
            {/* Header Row */}
            <Box sx={{ display: 'flex', px: 2, pt: 1.5, pb: 1, gap: 1.5, alignItems: 'center' }}>
                <Link to="/profile/$username" params={{ username: item.author.username || '' }}>
                    <Avatar src={item.author.avatarUrl || undefined} sx={{ cursor: 'pointer', width: 40, height: 40 }} />
                </Link>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ minWidth: 0, flexShrink: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Link
                                    to="/profile/$username"
                                    params={{ username: item.author.username || '' }}
                                    style={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
                                >
                                    <Typography noWrap variant="subtitle1" fontWeight={700} sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                        {item.author.username}
                                    </Typography>
                                </Link>
                                <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                    · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
                                @{item.author.username}
                            </Typography>
                        </Box>

                        {currentUserId && currentUserId !== item.author.id && (
                            <Button
                                size="small"
                                onClick={handleFollow}
                                variant="outlined"
                                sx={{
                                    borderRadius: 9999,
                                    px: 2,
                                    height: 28,
                                    ml: 'auto',
                                    fontSize: '0.75rem',
                                    color: 'black',
                                    borderColor: 'divider',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                                        borderColor: 'black',
                                    }
                                }}
                                disabled={toggleFollowMutation.isPending}
                            >
                                Follow
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Box>

            <Divider sx={{ mx: 2, mb: 1, mt: 0.5 }} />

            {/* Media Row */}
            <Box sx={{ px: 2, pb: 1.5, pt: 1 }}>
                <Box 
                    sx={{ 
                        borderRadius: 3, 
                        overflow: 'hidden', 
                        border: '1px solid', 
                        borderColor: 'divider',
                        position: 'relative',
                        width: '100%',
                        pt: '75%', // 4:3 Aspect Ratio
                        bgcolor: 'grey.100',
                        cursor: 'pointer'
                    }}
                    onClick={onClick}
                >
                    <Box
                        component="img"
                        src={getOptimizedImageUrl(item.thumbnailUrl || item.url)}
                        alt="Spot media"
                        crossOrigin="anonymous"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                    {item.type === 'video' && (
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'rgba(0,0,0,0.5)', borderRadius: '50%', p: 1 }}>
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 48 }} />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Actions Row */}
            <Box sx={{ px: 2, pb: 1.5 }}>
                <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ width: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onComment(item); }}
                            sx={{ '&:hover': { color: 'primary.main', bgcolor: 'rgba(29, 155, 240, 0.1)' } }}
                        >
                            <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" fontWeight={500}>
                            {item.commentCount}
                        </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: item.isLiked ? 'error.main' : 'text.secondary' }}>
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onLike(item.id, item.type); }}
                            color={item.isLiked ? "error" : "default"}
                            sx={{ '&:hover': { bgcolor: 'rgba(249, 24, 128, 0.1)' } }}
                        >
                            {item.isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                        <Typography variant="caption" fontWeight={500}>
                            {item.likeCount}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        {isAdmin && (
                            <IconButton
                                size="small"
                                onClick={handleDeleteMedia}
                                disabled={isActioning}
                                sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' } }}
                                title="Delete Media (Admin)"
                            >
                                <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onShare(item); }}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'rgba(29, 155, 240, 0.1)' } }}
                        >
                            <ShareIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
});

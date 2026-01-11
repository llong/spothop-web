import { Box, Typography, IconButton, Stack, Avatar } from '@mui/material';
import { Favorite, FavoriteBorder, PlayCircleOutline } from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from '@tanstack/react-router';
import type { MediaItem } from 'src/types';
import { getOptimizedImageUrl } from 'src/utils/imageOptimization';
import { memo } from 'react';

interface MediaCardProps {
    item: MediaItem;
    onToggleLike: () => void;
    isLoading: boolean;
    onSelect: () => void;
}

export const MediaCard = memo(({ item, onToggleLike, isLoading, onSelect }: MediaCardProps) => (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
            sx={{ position: 'relative', pt: '75%', bgcolor: 'black', cursor: 'pointer' }}
            onClick={onSelect}
        >
            {item.type === 'photo' ? (
                <Box
                    component="img"
                    src={getOptimizedImageUrl(item.url)}
                    alt={`Photo by ${item.author.username || 'unknown'}`}
                    loading="lazy"
                    decoding="async"
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.thumbnailUrl && (
                        <Box
                            component="img"
                            src={getOptimizedImageUrl(item.thumbnailUrl)}
                            alt={`Video thumbnail by ${item.author.username || 'unknown'}`}
                            loading="lazy"
                            decoding="async"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                        />
                    )}
                    <PlayCircleOutline sx={{ position: 'absolute', fontSize: 48, color: 'white' }} />
                </Box>
            )}
        </Box>
        <Box sx={{ p: 2, flexGrow: 1 }}>
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Link
                        to="/profile/$username"
                        params={{ username: item.author.username || 'unknown' }}
                        style={{ textDecoration: 'none', color: 'inherit', pointerEvents: item.author.username ? 'auto' : 'none' }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                                src={item.author.avatarUrl || undefined}
                                sx={{ width: 24, height: 24 }}
                                alt={`@${item.author.username || 'unknown'}`}
                            />
                            <Typography variant="body2" fontWeight={600}>@{item.author.username || 'unknown'}</Typography>
                        </Stack>
                    </Link>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" fontWeight={600}>{item.likeCount}</Typography>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike();
                            }}
                            disabled={isLoading}
                            aria-label={item.isLiked ? "Unlike" : "Like"}
                            sx={{ color: item.isLiked ? 'error.main' : 'text.secondary' }}
                        >
                            {item.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Uploaded on {format(new Date(item.createdAt), 'MMM d, yyyy')}
                </Typography>
            </Stack>
        </Box>
    </Box>
), (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.isLiked === nextProps.item.isLiked &&
           prevProps.item.likeCount === nextProps.item.likeCount &&
           prevProps.isLoading === nextProps.isLoading;
});

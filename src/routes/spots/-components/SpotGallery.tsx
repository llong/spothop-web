import { Box, useMediaQuery, useTheme, Typography, IconButton, Stack } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useState } from 'react';
import { useMediaLikes } from 'src/hooks/useMediaLikes';
import type { MediaItem } from 'src/types';

interface SpotGalleryProps {
    media: MediaItem[];
}

export const SpotGallery = ({ media: initialMedia }: SpotGalleryProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { toggleLike, loading } = useMediaLikes();
    const [mediaItems, setMediaItems] = useState(initialMedia);

    const handleToggleLike = async (item: MediaItem) => {
        const { success } = await toggleLike(item.id, item.type, item.isLiked);
        if (success) {
            setMediaItems(prev => prev.map(m => {
                if (m.id === item.id) {
                    return {
                        ...m,
                        isLiked: !m.isLiked,
                        likeCount: m.isLiked ? m.likeCount - 1 : m.likeCount + 1
                    };
                }
                return m;
            }));
        }
    };

    if (!mediaItems || mediaItems.length === 0) {
        return (
            <Box
                sx={{
                    height: 300,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2
                }}
            >
                <Typography color="text.secondary">No photos or videos available</Typography>
            </Box>
        );
    }

    const featuredMedia = mediaItems[0];
    const secondaryMedia = mediaItems.slice(1, 5);

    const MediaCard = ({ item, isFeatured = false }: { item: MediaItem, isFeatured?: boolean }) => (
        <Box
            sx={{
                flex: isFeatured ? { xs: 1, md: 2 } : 1,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
                '&:hover .media-overlay': {
                    opacity: 1
                }
            }}
        >
            {item.type === 'photo' ? (
                <img
                    src={item.url}
                    alt="Spot view"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <Box
                    component="video"
                    src={item.url}
                    poster={item.thumbnailUrl}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {/* Like Overlay */}
            <Box
                className="media-overlay"
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    opacity: { xs: 1, md: 0 },
                    transition: 'opacity 0.2s'
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" color="white" fontWeight={600}>
                        {item.likeCount}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(item);
                        }}
                        disabled={loading[item.id]}
                        sx={{ color: item.isLiked ? 'error.main' : 'white' }}
                    >
                        {item.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </IconButton>
                </Stack>
            </Box>

            {item.type === 'video' && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                    }}
                >
                    Video
                </Box>
            )}
        </Box>
    );

    return (
        <Box sx={{ height: { xs: 300, md: 450 }, mb: 3, display: 'flex', gap: 1 }}>
            <MediaCard item={featuredMedia} isFeatured />

            {!isMobile && secondaryMedia.length > 0 && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {secondaryMedia.slice(0, 2).map((item, index) => {
                        const isLast = index === 1 && mediaItems.length > 3;
                        const remainingCount = mediaItems.length - 3;

                        return (
                            <Box key={item.id} sx={{ flex: 1, position: 'relative' }}>
                                <MediaCard item={item} />
                                {isLast && remainingCount > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            bgcolor: 'rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 2,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <Typography variant="h6" color="white" fontWeight={600}>
                                            +{remainingCount} more
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

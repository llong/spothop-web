import { Box, useMediaQuery, useTheme, Typography, IconButton, Stack, Button, Dialog, DialogTitle, DialogContent, Grid, Avatar } from '@mui/material';
import { Favorite, FavoriteBorder, ChevronLeft, ChevronRight, Close, PlayCircleOutline } from '@mui/icons-material';
import { useState } from 'react';
import { useMediaLikes } from 'src/hooks/useMediaLikes';
import type { MediaItem } from 'src/types';
import { format } from 'date-fns';
import { Link } from '@tanstack/react-router';

interface SpotGalleryProps {
    media: MediaItem[];
}

export const SpotGallery = ({ media: initialMedia }: SpotGalleryProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { toggleLike, loading } = useMediaLikes();
    const [mediaItems, setMediaItems] = useState(initialMedia);
    const [activeIndex, setActiveIndex] = useState(0);
    const [fullGalleryOpen, setFullGalleryOpen] = useState(false);

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

    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % mediaItems.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

    const currentItem = mediaItems[activeIndex];

    return (
        <Box sx={{ mb: 3 }}>
            {/* Main Carousel View */}
            <Box
                sx={{
                    height: { xs: 300, md: 500 },
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'black'
                }}
            >
                {currentItem.type === 'photo' ? (
                    <img
                        src={currentItem.url}
                        alt="Spot view"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Box
                        component="video"
                        key={currentItem.id}
                        src={currentItem.url}
                        controls
                        playsInline
                        preload="metadata"
                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                        Your browser does not support the video tag.
                    </Box>
                )}

                {/* Navigation Arrows */}
                {mediaItems.length > 1 && (
                    <>
                        <IconButton
                            onClick={prevSlide}
                            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton
                            onClick={nextSlide}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </>
                )}

                {/* Info Overlay (Bottom Right) */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center'
                    }}
                >
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setFullGalleryOpen(true)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'black', '&:hover': { bgcolor: 'white' }, fontWeight: 600 }}
                    >
                        View all {mediaItems.length}
                    </Button>
                </Box>

                {/* Like Button on Main View */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.5, borderRadius: 10, color: 'white' }}>
                        <Typography variant="body2" fontWeight={700}>{currentItem.likeCount}</Typography>
                        <IconButton
                            size="small"
                            onClick={() => handleToggleLike(currentItem)}
                            disabled={loading[currentItem.id]}
                            sx={{ color: currentItem.isLiked ? 'error.main' : 'white' }}
                        >
                            {currentItem.isLiked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Box>
            </Box>

            {/* Full Media Gallery Dialog */}
            <Dialog
                fullScreen={isMobile}
                open={fullGalleryOpen}
                onClose={() => setFullGalleryOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    All Media ({mediaItems.length})
                    <IconButton onClick={() => setFullGalleryOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: 'grey.50' }}>
                    <Grid container spacing={2}>
                        {mediaItems.map((item) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                <CardWithMeta item={item} onToggleLike={() => handleToggleLike(item)} isLoading={loading[item.id]} />
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

const CardWithMeta = ({ item, onToggleLike, isLoading }: { item: MediaItem, onToggleLike: () => void, isLoading: boolean }) => (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'black' }}>
            {item.type === 'photo' ? (
                <Box
                    component="img"
                    src={item.url}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.thumbnailUrl && (
                        <Box
                            component="img"
                            src={item.thumbnailUrl}
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
                            <Avatar src={item.author.avatarUrl || undefined} sx={{ width: 24, height: 24 }} />
                            <Typography variant="body2" fontWeight={600}>@{item.author.username || 'unknown'}</Typography>
                        </Stack>
                    </Link>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" fontWeight={600}>{item.likeCount}</Typography>
                        <IconButton size="small" onClick={onToggleLike} disabled={isLoading} sx={{ color: item.isLiked ? 'error.main' : 'text.secondary' }}>
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
);

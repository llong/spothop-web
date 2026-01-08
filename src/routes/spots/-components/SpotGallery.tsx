import { Box, useMediaQuery, useTheme, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import { useMediaLikes } from 'src/hooks/useMediaLikes';
import type { MediaItem } from 'src/types';
import { useRouter, useBlocker } from '@tanstack/react-router';
import { getOptimizedImageUrl } from 'src/utils/imageOptimization';
import { EmblaCarousel } from './EmblaCarousel';
import { MediaGrid } from './MediaGrid';
import { Lightbox } from './Lightbox';

interface SpotGalleryProps {
    media: MediaItem[];
}

export const SpotGallery = ({ media: initialMedia }: SpotGalleryProps) => {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { toggleLike, loading: likeLoading } = useMediaLikes();

    const [mediaItems, setMediaItems] = useState(initialMedia);
    const [activeIndex, setActiveIndex] = useState(0);
    const [fullGalleryOpen, setFullGalleryOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const handleToggleLike = useCallback(async (item: MediaItem) => {
        const { success } = await toggleLike(item.id, item.type, item.isLiked);
        if (success) {
            setMediaItems(prev => prev.map(m =>
                m.id === item.id ? {
                    ...m,
                    isLiked: !m.isLiked,
                    likeCount: m.isLiked ? m.likeCount - 1 : m.likeCount + 1
                } : m
            ));
        }
    }, [toggleLike]);

    const handleOpenLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }, []);

    // Android/Browser Back Gesture Handling
    useBlocker({
        condition: lightboxOpen || fullGalleryOpen,
        blockerFn: () => {
            if (lightboxOpen) {
                setLightboxOpen(false);
                return false;
            }
            if (fullGalleryOpen) {
                setFullGalleryOpen(false);
                return false;
            }
            return true;
        }
    });

    if (!mediaItems?.length) return null;

    return (
        <Box sx={{ mb: 3 }}>
            {/* Main Header Carousel */}
            <Box sx={{ height: { xs: 300, md: 500 }, borderRadius: 2, overflow: 'hidden', position: 'relative', bgcolor: 'black' }}>
                <EmblaCarousel startIndex={activeIndex} onIndexChange={setActiveIndex}>
                    {mediaItems.map((item, index) => (
                        <Box
                            key={item.id}
                            onClick={() => handleOpenLightbox(index)}
                            sx={{ width: '100%', height: '100%', cursor: 'pointer' }}
                        >
                            {item.type === 'photo' ? (
                                <img
                                    src={getOptimizedImageUrl(item.url)}
                                    alt="Spot"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', pointerEvents: 'none' }}
                                />
                            ) : (
                                <Box component="video" src={item.url} playsInline preload="metadata" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )}
                        </Box>
                    ))}
                </EmblaCarousel>

                {/* Overlaid UI Controls */}
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ArrowBack />}
                    onClick={(e) => { e.stopPropagation(); router.history.back(); }}
                    sx={{
                        position: 'absolute', top: 16, left: 16, zIndex: 10,
                        bgcolor: 'rgba(255,255,255,0.8)', color: 'black', borderColor: 'rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: 'white', borderColor: 'black' },
                        fontWeight: 600, backdropFilter: 'blur(4px)'
                    }}
                >
                    Back
                </Button>

                <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setFullGalleryOpen(true)}
                        sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'black', '&:hover': { bgcolor: 'white' }, fontWeight: 600 }}
                    >
                        View all {mediaItems.length}
                    </Button>
                </Box>
            </Box>

            {/* Sub-Components for Overlays */}
            <MediaGrid
                open={fullGalleryOpen}
                onClose={() => setFullGalleryOpen(false)}
                mediaItems={mediaItems}
                onToggleLike={handleToggleLike}
                loadingStates={likeLoading}
                onSelect={handleOpenLightbox}
                isMobile={isMobile}
            />

            <Lightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                mediaItems={mediaItems}
                currentIndex={lightboxIndex}
                onIndexChange={setLightboxIndex}
                onToggleLike={handleToggleLike}
                loadingStates={likeLoading}
            />
        </Box>
    );
};

import { useState, useCallback, memo } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MovieIcon from '@mui/icons-material/Movie';
import type { MediaItem } from 'src/types';
import React from 'react';

interface MediaCarouselProps {
    media: MediaItem[];
    isLoading?: boolean;
    activeSlide: number;
    onSlideChange: (index: number) => void;
    onItemClick?: (index: number) => void;
}

export const MediaCarousel = memo(({ media, isLoading, activeSlide, onSlideChange, onItemClick }: MediaCarouselProps) => {
    const [showVideo, setShowVideo] = useState<Record<string, boolean>>({});

    const handleNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSlideChange((activeSlide + 1) % media.length);
    }, [activeSlide, media.length, onSlideChange]);

    const handleBack = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onSlideChange((activeSlide - 1 + media.length) % media.length);
    }, [activeSlide, media.length, onSlideChange]);

    const toggleVideo = useCallback((id: string, play: boolean) => {
        setShowVideo(prev => ({ ...prev, [id]: play }));
    }, []);

    if (isLoading || media.length === 0) {
        return (
            <Box sx={{ width: '100%', pt: '100%', bgcolor: 'grey.100', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">No media available</Typography>
            </Box>
        );
    }

    const currentItem = media[activeSlide];

    return (
        <Box sx={{ position: 'relative', width: '100%', pt: '75%', bgcolor: 'grey.100', overflow: 'hidden' }}>
            {currentItem.type === 'photo' ? (
                <Box
                    component="img"
                    src={currentItem.url}
                    alt="Spot media"
                    onClick={() => onItemClick?.(activeSlide)}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: onItemClick ? 'pointer' : 'default'
                    }}
                />
            ) : (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    {!showVideo[currentItem.id] ? (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                bgcolor: 'black'
                            }}
                            onClick={(e) => {
                                // If they click the button, play video. 
                                // If they click elsewhere, open lightbox.
                                if ((e.target as HTMLElement).closest('button')) {
                                    toggleVideo(currentItem.id, true);
                                } else {
                                    onItemClick?.(activeSlide);
                                }
                            }}
                        >
                            {currentItem.thumbnailUrl ? (
                                <Box
                                    component="img"
                                    src={currentItem.thumbnailUrl}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'grey.500' }}>
                                    <MovieIcon sx={{ fontSize: 64, mb: 1 }} />
                                    <Typography variant="caption">No thumbnail</Typography>
                                </Box>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<PlayArrowIcon />}
                                sx={{
                                    position: 'absolute',
                                    borderRadius: 9999,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    zIndex: 2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    bgcolor: 'white',
                                    color: 'black',
                                    px: 3,
                                    py: 1,
                                    '&:hover': { bgcolor: 'grey.100' }
                                }}
                            >
                                Show Video
                            </Button>
                        </Box>
                    ) : (
                        <Box
                            component="video"
                            src={currentItem.url}
                            controls
                            autoPlay
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </Box>
            )}

            {media.length > 1 && (
                <>
                    <IconButton
                        onClick={handleBack}
                        sx={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            color: 'black',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: 'white' },
                            zIndex: 2,
                            width: 40,
                            height: 40
                        }}
                    >
                        <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.8)',
                            color: 'black',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            '&:hover': { bgcolor: 'white' },
                            zIndex: 2,
                            width: 40,
                            height: 40
                        }}
                    >
                        <KeyboardArrowRight />
                    </IconButton>
                    
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            color: 'black',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 9999,
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {activeSlide + 1} / {media.length}
                    </Box>
                </>
            )}
        </Box>
    );
});
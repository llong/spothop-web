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
}

export const MediaCarousel = memo(({ media, isLoading, activeSlide, onSlideChange }: MediaCarouselProps) => {
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
        <Box sx={{ position: 'relative', width: '100%', pt: '100%', bgcolor: 'black', overflow: 'hidden' }}>
            {currentItem.type === 'photo' ? (
                <Box
                    component="img"
                    src={currentItem.url}
                    alt="Spot media"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
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
                            onClick={() => toggleVideo(currentItem.id, true)}
                        >
                            {currentItem.thumbnailUrl ? (
                                <Box
                                    component="img"
                                    src={currentItem.thumbnailUrl}
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.7 }}
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
                                    borderRadius: 10,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    zIndex: 2,
                                    boxShadow: 3
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
                            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    )}
                </Box>
            )}

            {media.length > 1 && (
                <>
                    <IconButton
                        size="small"
                        onClick={handleBack}
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.3)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                            zIndex: 2
                        }}
                    >
                        <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={handleNext}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.3)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                            zIndex: 2
                        }}
                    >
                        <KeyboardArrowRight />
                    </IconButton>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1,
                            zIndex: 2
                        }}
                    >
                        {media.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: index === activeSlide ? 'white' : 'rgba(255,255,255,0.5)',
                                    boxShadow: 1
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
});
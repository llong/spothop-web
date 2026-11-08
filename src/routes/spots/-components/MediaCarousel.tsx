import { useCallback, useEffect, useRef, memo } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MovieIcon from '@mui/icons-material/Movie';
import type { MediaItem } from '@/types';
import { OptimizedImage } from '@/components/OptimizedImage';

/** Slides further than this from the active one stay empty, so a big post doesn't load every photo up front. */
const RENDER_DISTANCE = 1;

/**
 * Prev/next arrows are a mouse affordance: small, translucent and only shown while hovering the media.
 * Touch screens (no hover) navigate by swiping and by the dots instead.
 */
const arrowSx = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    width: 32,
    height: 32,
    color: 'common.white',
    bgcolor: 'rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(4px)',
    opacity: 0,
    transition: 'opacity 0.15s, background-color 0.15s',
    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.65)' },
    '&:focus-visible': { opacity: 1 },
    '@media (hover: none)': { display: 'none' },
} as const;

const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } as const;

interface SlideProps {
    item: MediaItem;
    index: number;
    total: number;
    active: boolean;
    /** Whether the media is loaded (the active slide and its neighbours). */
    render: boolean;
    showVideo: boolean;
    onShowVideo?: () => void;
    onItemClick?: (index: number) => void;
}

const Slide = ({ item, index, total, active, render, showVideo, onShowVideo, onItemClick }: SlideProps) => (
    <Box
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${total}`}
        // Off-screen slides must not be focusable (video controls, buttons) or read out
        inert={!active}
        sx={{ position: 'relative', flex: '0 0 100%', height: '100%', scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
    >
        {render && item.type === 'photo' && (
            <OptimizedImage
                src={item.url}
                alt="Spot media"
                onClick={() => onItemClick?.(index)}
                sx={{ ...fill, cursor: onItemClick ? 'pointer' : 'default' }}
            />
        )}

        {render && item.type !== 'photo' && (
            <Box sx={fill}>
                {active && showVideo ? (
                    <Box
                        component="video"
                        src={item.url}
                        controls
                        autoPlay
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
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
                            if ((e.target as HTMLElement).closest('button')) {
                                onShowVideo?.();
                            } else {
                                onItemClick?.(index);
                            }
                        }}
                    >
                        {item.thumbnailUrl ? (
                            <OptimizedImage
                                src={item.thumbnailUrl}
                                alt="Video thumbnail"
                                sx={{ width: '100%', height: '100%', opacity: 0.8 }}
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
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                bgcolor: 'rgba(0,0,0,0.65)',
                                color: 'white',
                                px: 3,
                                py: 1,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }
                            }}
                        >
                            Show Video
                        </Button>
                    </Box>
                )}
            </Box>
        )}
    </Box>
);

interface MediaCarouselProps {
    media: MediaItem[];
    isLoading?: boolean;
    activeSlide: number;
    onSlideChange: (index: number) => void;
    onItemClick?: (index: number) => void;
    /** Lifted video play state — managed by FeedItemCard to survive Virtuoso remounts */
    showVideo?: boolean;
    onShowVideo?: () => void;
}

/**
 * Slides sit side by side in a native scroll-snap track: swiping follows the finger with momentum and
 * snaps to the next item, and arrows/dots scroll the same track smoothly. `activeSlide` stays the
 * source of truth for the parent, kept in sync with the scroll position both ways.
 */
export const MediaCarousel = memo(({ media, isLoading, activeSlide, onSlideChange, onItemClick, showVideo = false, onShowVideo }: MediaCarouselProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    /** Slide a programmatic scroll is heading to; scroll events are ignored until it arrives. */
    const scrollTarget = useRef<number | null>(null);
    const hasMounted = useRef(false);

    const indexAtScroll = (track: HTMLDivElement) => Math.round(track.scrollLeft / track.clientWidth);

    const handleScroll = () => {
        const track = trackRef.current;
        if (!track?.clientWidth) return;
        const index = indexAtScroll(track);
        if (scrollTarget.current !== null) {
            if (index === scrollTarget.current) scrollTarget.current = null;
            return;
        }
        if (index !== activeSlide) onSlideChange(index);
    };

    // activeSlide changed from outside (arrows, dots): scroll the track to it
    useEffect(() => {
        const track = trackRef.current;
        if (!track?.clientWidth || indexAtScroll(track) === activeSlide) return;

        const distance = Math.abs(indexAtScroll(track) - activeSlide);
        const animate = hasMounted.current && distance === 1 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        scrollTarget.current = activeSlide;
        track.scrollTo({ left: activeSlide * track.clientWidth, behavior: animate ? 'smooth' : 'auto' });
        // Never leave the guard set if the scroll ends up not reaching the slide exactly
        const timer = setTimeout(() => { scrollTarget.current = null; }, 800);
        return () => clearTimeout(timer);
    }, [activeSlide]);

    useEffect(() => {
        hasMounted.current = true;
    }, []);

    const goTo = useCallback((e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        onSlideChange(index);
    }, [onSlideChange]);

    if (isLoading || media.length === 0) {
        return (
            <Box sx={{ width: '100%', pt: '100%', bgcolor: 'grey.100', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography color="text.secondary">No media available</Typography>
            </Box>
        );
    }

    const lastIndex = media.length - 1;

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                pt: '75%',
                bgcolor: 'grey.100',
                overflow: 'hidden',
                '&:hover .carousel-arrow': { opacity: 1 },
            }}
        >
            <Box
                ref={trackRef}
                onScroll={handleScroll}
                // A new gesture takes over from any programmatic scroll
                onTouchStart={() => { scrollTarget.current = null; }}
                onWheel={() => { scrollTarget.current = null; }}
                sx={{
                    ...fill,
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    overscrollBehaviorX: 'contain', // don't trigger the browser's back-swipe
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {media.map((item, index) => (
                    <Slide
                        key={item.id}
                        item={item}
                        index={index}
                        total={media.length}
                        active={index === activeSlide}
                        render={Math.abs(index - activeSlide) <= RENDER_DISTANCE}
                        showVideo={showVideo}
                        onShowVideo={onShowVideo}
                        onItemClick={onItemClick}
                    />
                ))}
            </Box>

            {media.length > 1 && (
                <>
                    {activeSlide > 0 && (
                        <IconButton
                            className="carousel-arrow"
                            aria-label="Previous"
                            onClick={(e) => goTo(e, activeSlide - 1)}
                            sx={{ ...arrowSx, left: 12 }}
                        >
                            <KeyboardArrowLeft />
                        </IconButton>
                    )}
                    {activeSlide < lastIndex && (
                        <IconButton
                            className="carousel-arrow"
                            aria-label="Next"
                            onClick={(e) => goTo(e, activeSlide + 1)}
                            sx={{ ...arrowSx, right: 12 }}
                        >
                            <KeyboardArrowRight />
                        </IconButton>
                    )}

                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            zIndex: 2,
                        }}
                    >
                        {media.map((item, index) => (
                            <Box
                                component="button"
                                type="button"
                                key={item.id}
                                aria-label={`Go to item ${index + 1} of ${media.length}`}
                                aria-current={index === activeSlide}
                                onClick={(e: React.MouseEvent) => goTo(e, index)}
                                // 14px hit area around a 6px dot
                                sx={{
                                    width: 14,
                                    height: 14,
                                    p: 0,
                                    border: 0,
                                    bgcolor: 'transparent',
                                    cursor: 'pointer',
                                    display: 'grid',
                                    placeItems: 'center',
                                    '&::before': {
                                        content: '""',
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: index === activeSlide ? 'common.white' : 'rgba(255, 255, 255, 0.55)',
                                        boxShadow: '0 0 3px rgba(0, 0, 0, 0.6)',
                                        transition: 'background-color 0.15s',
                                    },
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
});

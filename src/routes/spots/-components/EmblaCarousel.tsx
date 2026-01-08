import { Box, IconButton, styled } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

// Embla types are sometimes tricky with react wrapper
type EmblaOptionsType = any;

const CarouselRoot = styled(Box)(() => ({
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    overscrollBehaviorX: 'none',
}));

const Viewport = styled(Box)(() => ({
    height: '100%',
    overflow: 'hidden',
    cursor: 'grab',
    '&:active': {
        cursor: 'grabbing',
    },
    touchAction: 'pan-y',
}));

const Container = styled(Box)(() => ({
    display: 'flex',
    height: '100%',
    marginLeft: '-10px', // Compensate for slide padding
}));

const Slide = styled(Box)(() => ({
    flex: '0 0 90%', // Show 90% of the slide to create the 'peek' effect
    minWidth: 0,
    paddingLeft: '10px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 900px)': {
        flex: '0 0 100%',
    },
}));

interface CarouselProps {
    children: React.ReactNode[];
    options?: EmblaOptionsType;
    onIndexChange?: (index: number) => void;
    startIndex?: number;
}

export const EmblaCarousel = ({ children, options = {}, onIndexChange, startIndex = 0 }: CarouselProps) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        dragFree: false,
        containScroll: 'trimSnaps',
        startIndex,
        ...options
    });

    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
        if (onIndexChange) onIndexChange(emblaApi.selectedScrollSnap());
    }, [emblaApi, onIndexChange]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    const scrollPrev = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <CarouselRoot>
            <Viewport ref={emblaRef}>
                <Container>
                    {children.map((child, index) => (
                        <Slide key={index}>
                            {child}
                        </Slide>
                    ))}
                </Container>
            </Viewport>

            {children.length > 1 && (
                <>
                    <IconButton
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                            zIndex: 10,
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <ChevronLeft fontSize="large" />
                    </IconButton>
                    <IconButton
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255,255,255,0.3)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                            zIndex: 10,
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <ChevronRight fontSize="large" />
                    </IconButton>
                </>
            )}
        </CarouselRoot>
    );
};

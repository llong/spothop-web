import { useState, useCallback, useEffect } from 'react';
import type { UserMediaItem } from 'src/types';

export function useLightbox(mediaItems: UserMediaItem[]) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const nextMedia = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! + 1) % mediaItems.length);
        }
    }, [lightboxIndex, mediaItems.length]);

    const prevMedia = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! - 1 + mediaItems.length) % mediaItems.length);
        }
    }, [lightboxIndex, mediaItems.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowRight') nextMedia();
            if (e.key === 'ArrowLeft') prevMedia();
            if (e.key === 'Escape') closeLightbox();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, nextMedia, prevMedia]);

    const currentMedia = lightboxIndex !== null ? mediaItems[lightboxIndex] : null;

    return {
        lightboxIndex,
        currentMedia,
        openLightbox,
        closeLightbox,
        nextMedia,
        prevMedia
    };
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMediaQuery, useTheme } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { useSpotQuery, useDeleteSpotMutation } from 'src/hooks/useSpotQueries';
import { useSpotFavorites } from 'src/hooks/useSpotFavorites';
import { useMediaLikes } from 'src/hooks/useMediaLikes';
import { useFlagging } from 'src/hooks/useFlagging';
import { rightSidebarAtom } from 'src/atoms/ui';
import { analytics } from 'src/lib/posthog';
import type { MediaItem } from 'src/types';

export function useSpotDetailsState(spotId: string) {
    const auth = useAtomValue(userAtom);
    const { data: currentUserProfile } = useProfileQuery(auth?.user.id);
    const [activeSlide, setActiveSlide] = useState(0);
    const { data: spot, isLoading, error } = useSpotQuery(spotId, auth?.user.id);
    const deleteMutation = useDeleteSpotMutation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
    const { isFavorited, toggleFavorite } = useSpotFavorites(spot ?? undefined, auth?.user.id);
    const { toggleLike: toggleMediaLike, loading: mediaLoadingStates } = useMediaLikes();
    const [mediaCommentItem, setMediaCommentItem] = useState<MediaItem | null>(null);
    const { flagSpot } = useFlagging();
    const setRightSidebarContent = useSetAtom(rightSidebarAtom);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        if (spot) {
            analytics.capture('spot_viewed', {
                spot_id: spot.id,
                category: spot.spot_type,
                city: spot.city,
                country: spot.country
            });
        }
    }, [spot?.id]);

    const handleOpenLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (window.confirm('Are you sure you want to delete this spot?')) {
            await deleteMutation.mutateAsync(spotId);
            navigate({ to: '/spots' });
        }
    }, [spotId, deleteMutation, navigate]);

    const handleDirections = useCallback(() => {
        if (!spot) return;
        analytics.capture('spot_navigated_to', {
            spot_id: spot.id,
            spot_name: spot.name
        });
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`, '_blank');
    }, [spot]);

    const handleShare = useCallback(() => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: spot?.name, url }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    }, [spot?.name]);

    return {
        auth,
        currentUserProfile,
        spot,
        isLoading,
        error,
        activeSlide,
        setActiveSlide,
        isLargeScreen,
        isFavorited,
        toggleFavorite,
        toggleMediaLike,
        mediaLoadingStates,
        mediaCommentItem,
        setMediaCommentItem,
        flagSpot,
        lightboxOpen,
        setLightboxOpen,
        lightboxIndex,
        setLightboxIndex,
        handleOpenLightbox,
        handleDelete,
        handleDirections,
        handleShare,
        setRightSidebarContent
    };
}

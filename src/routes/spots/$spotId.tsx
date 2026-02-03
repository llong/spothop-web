import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { spotKeys, useSpotQuery, useDeleteSpotMutation } from 'src/hooks/useSpotQueries';
import { spotService } from 'src/services/spotService';
import {
    Box,
    Container,
    Typography,
    Divider,
    Stack,
    Button,
    CircularProgress,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsIcon from '@mui/icons-material/Directions';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { MediaCarousel } from './-components/MediaCarousel';
import { useSpotFavorites } from 'src/hooks/useSpotFavorites';
import { useMediaLikes } from 'src/hooks/useMediaLikes';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { FeedCommentDialog } from 'src/routes/feed/-components/FeedCommentDialog';
import { useFlagging } from 'src/hooks/useFlagging';
import { rightSidebarAtom } from 'src/atoms/ui';
import { Lightbox } from './-components/Lightbox';
import { DetailsSidebar } from './-components/DetailsSidebar';
import { DetailsInfo } from './-components/DetailsInfo';
import { DetailsActions } from './-components/DetailsActions';
import { DetailsMediaSection } from './-components/DetailsMediaSection';
import type { FeedItem, MediaItem } from 'src/types';

const loader = async ({ params, context }: { params: { spotId: string }, context: any }) => {
    const { queryClient } = context;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    // Prefetch Spot Details via QueryClient
    await queryClient.ensureQueryData({
        queryKey: spotKeys.details(params.spotId),
        queryFn: () => spotService.fetchSpotDetails(params.spotId, userId),
    });

    return { spotId: params.spotId };
};

export function SpotDetails() {
    const { spotId } = useParams({ from: '/spots/$spotId' });
    const auth = useAtomValue(userAtom);
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
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`, '_blank');
    }, [spot]);

    const handleShare = useCallback(() => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: spot?.name,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    }, [spot?.name]);

    const sidebarContent = useMemo(() => spot ? (
        <DetailsSidebar
            spot={spot}
            currentUserId={auth?.user.id}
            onDirections={handleDirections}
            onDelete={handleDelete}
        />
    ) : null, [spot, auth?.user.id, handleDirections, handleDelete]);

    useEffect(() => {
        if (isLargeScreen) {
            setRightSidebarContent(sidebarContent);
        } else {
            setRightSidebarContent(null);
        }
        return () => setRightSidebarContent(null);
    }, [isLargeScreen, sidebarContent, setRightSidebarContent]);

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );

    if (error || !spot) return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography color="error" gutterBottom>Failed to load spot details</Typography>
                <Button variant="contained" onClick={() => navigate({ to: '/spots' })} sx={{ mt: 2 }}>Back to Spots</Button>
            </Box>
        </Container>
    );

    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
            <Box sx={{ position: 'relative', width: '100%' }}>
                <MediaCarousel
                    media={spot.media}
                    activeSlide={activeSlide}
                    onSlideChange={setActiveSlide}
                    onItemClick={handleOpenLightbox}
                />

                <Button
                    onClick={() => window.history.back()}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        color: 'black',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 9999,
                        px: 2,
                        '&:hover': { bgcolor: 'white' },
                        zIndex: 10,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    Back
                </Button>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Stack spacing={3}>
                    <DetailsInfo spot={spot} />

                    <DetailsActions
                        spot={spot}
                        isFavorited={isFavorited}
                        onToggleFavorite={toggleFavorite}
                        onOpenComments={() => { }} // Spot-level comments disabled
                        onShare={handleShare}
                        onFlag={() => flagSpot(spot.id, 'inappropriate_content')}
                    />

                    <Divider />

                    <DetailsMediaSection
                        spot={spot}
                        currentUserId={auth?.user.id}
                        onLike={(id, type) => {
                            const item = spot.media.find(m => m.id === id);
                            if (item) toggleMediaLike(id, type, item.isLiked);
                        }}
                        onComment={setMediaCommentItem}
                        onShare={handleShare}
                        onItemClick={handleOpenLightbox}
                    />

                    {!isLargeScreen && (
                        <Box sx={{ pt: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<DirectionsIcon />}
                                onClick={handleDirections}
                                sx={{ py: 2, borderRadius: 2 }}
                            >
                                Get Directions
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Box>

            {!!mediaCommentItem && (
                <FeedCommentDialog
                    open={true}
                    onClose={() => setMediaCommentItem(null)}
                    item={{
                        media_id: mediaCommentItem.id,
                        media_type: mediaCommentItem.type,
                        spot_id: spot.id,
                        uploader_id: mediaCommentItem.author.id,
                        media_url: mediaCommentItem.url,
                        thumbnail_url: mediaCommentItem.thumbnailUrl,
                        created_at: mediaCommentItem.createdAt,
                        spot_name: spot.name,
                        city: spot.city,
                        country: spot.country,
                        uploader_username: mediaCommentItem.author.username,
                        uploader_display_name: mediaCommentItem.author.username,
                        uploader_avatar_url: mediaCommentItem.author.avatarUrl,
                        is_followed_by_user: false,
                        like_count: mediaCommentItem.likeCount,
                        comment_count: mediaCommentItem.commentCount || 0,
                        popularity_score: 0,
                        is_liked_by_user: mediaCommentItem.isLiked,
                        is_favorited_by_user: false,
                    } as FeedItem}
                    userId={auth?.user.id}
                    spotId={spot.id}
                />
            )}

            <Lightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                mediaItems={spot.media}
                currentIndex={lightboxIndex}
                onIndexChange={setLightboxIndex}
                onToggleLike={(item) => toggleMediaLike(item.id, item.type, item.isLiked)}
                loadingStates={mediaLoadingStates}
            />
        </Box>
    );
}

export const Route = createFileRoute('/spots/$spotId')({
    loader,
    component: SpotDetails,
})
import { Box, IconButton, Stack, Avatar, Typography, Dialog, styled, Button } from '@mui/material';
import { Favorite, FavoriteBorder, Close, DeleteForever } from '@mui/icons-material';
import { format } from 'date-fns';
import { EmblaCarousel } from './EmblaCarousel';
import type { MediaItem } from 'src/types';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { useAdminQueries } from 'src/hooks/useAdminQueries';

const LightboxVideo = styled('video')({
    maxWidth: '100%',
    maxHeight: '100%',
    userSelect: 'none',
});

interface LightboxProps {
    open: boolean;
    onClose: () => void;
    mediaItems: MediaItem[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    onToggleLike: (item: MediaItem) => void;
    loadingStates: Record<string, boolean>;
}

import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';

export const Lightbox = ({
    open,
    onClose,
    mediaItems,
    currentIndex,
    onIndexChange,
    onToggleLike,
    loadingStates
}: LightboxProps) => {
    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);
    const { deleteContent, isActioning } = useAdminQueries();
    const isAdmin = profile?.role === 'admin';
    const currentItem = mediaItems[currentIndex];

    if (!currentItem) return null;

    const handleDeleteMedia = async () => {
        if (window.confirm('ADMIN: Are you sure you want to delete this media item? This cannot be undone.')) {
            await deleteContent({ type: 'media', id: currentItem.id });
            onClose();
            // Note: The UI will refresh when the parent refetches spot details
            window.location.reload();
        }
    };

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { bgcolor: 'black', color: 'white', overscrollBehaviorX: 'none' }
            }}
        >
            <Box sx={{ height: '100%', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 15 }}
                >
                    <Close fontSize="large" />
                </IconButton>

                <EmblaCarousel
                    startIndex={currentIndex}
                    onIndexChange={onIndexChange}
                >
                    {mediaItems.map((item, idx) => (
                        <Box key={item.id} sx={{ minWidth: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 0, md: 8 } }}>
                            {item.type === 'photo' ? (
                                <img
                                    src={item.url}
                                    alt={`Lightbox photo ${idx + 1}`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        userSelect: 'none',
                                        pointerEvents: 'none'
                                    }}
                                />
                            ) : (
                                <LightboxVideo
                                    key={item.id}
                                    src={item.url}
                                    controls
                                    autoPlay={idx === currentIndex}
                                >
                                    Your browser does not support the video tag.
                                </LightboxVideo>
                            )}
                        </Box>
                    ))}
                </EmblaCarousel>

                {/* Meta Info Overlay (Bottom) */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', zIndex: 10 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar src={currentItem.author.avatarUrl || undefined} sx={{ width: 40, height: 40 }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>@{currentItem.author.username || 'unknown'}</Typography>
                                <Typography variant="caption" color="grey.400">
                                    Uploaded on {format(new Date(currentItem.createdAt), 'MMMM d, yyyy')}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {isAdmin && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteForever />}
                                    onClick={handleDeleteMedia}
                                    disabled={isActioning}
                                    sx={{ mr: 2 }}
                                >
                                    Delete
                                </Button>
                            )}
                            <Typography variant="h6">{currentItem.likeCount}</Typography>
                            <IconButton
                                onClick={() => onToggleLike(currentItem)}
                                disabled={loadingStates[currentItem.id]}
                                sx={{ color: currentItem.isLiked ? 'error.main' : 'white' }}
                            >
                                {currentItem.isLiked ? <Favorite fontSize="large" /> : <FavoriteBorder fontSize="large" />}
                            </IconButton>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Dialog>
    );
};

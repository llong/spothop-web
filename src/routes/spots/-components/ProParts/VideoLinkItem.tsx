import { useState } from 'react';
import { Box, Typography, IconButton, Paper, Stack, Menu, MenuItem } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SpotVideoLink } from 'src/types';
import { secondsToTime } from 'src/utils/youtube';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { spotService } from 'src/services/spotService';
import { AddVideoLinkDialog } from './AddVideoLinkDialog';
import { VideoPlayerModal } from './VideoPlayerModal';
import { useYoutubePlayer } from '../../hooks/useYoutubePlayer';

interface VideoLinkItemProps {
    link: SpotVideoLink;
    currentUserId?: string;
    onLike: (id: string, isLiked: boolean) => void;
    onDeleteSuccess: () => void;
    onEditSuccess: () => void;
}

export const VideoLinkItem = ({ link, currentUserId, onLike, onDeleteSuccess, onEditSuccess }: VideoLinkItemProps) => {
    const { data: profile } = useProfileQuery(currentUserId);
    const isAdmin = profile?.role === 'admin';
    const isOwner = currentUserId === link.user_id;
    const canManage = isAdmin || isOwner;

    const { isPlaying, playerKey, handlePlay, handleClose, handleReplay } = useYoutubePlayer(link.id, link.start_time || 0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        handleMenuClose();
        setIsEditDialogOpen(true);
    };

    const handleDelete = async () => {
        handleMenuClose();
        if (window.confirm('Are you sure you want to delete this video link?')) {
            try {
                await spotService.deleteVideoLink(link.id);
                onDeleteSuccess();
            } catch (err) {
                console.error('Failed to delete video link', err);
                alert('Failed to delete video link');
            }
        }
    };

    const thumbnailUrl = `https://img.youtube.com/vi/${link.youtube_video_id}/hqdefault.jpg`;
    
    let embedUrl = `https://www.youtube.com/embed/${link.youtube_video_id.trim()}?autoplay=1&start=${link.start_time || 0}&playsinline=1&enablejsapi=1`;
    if (link.end_time) {
        embedUrl += `&end=${link.end_time}`;
    }

    return (
        <>
            <Paper 
                sx={{ 
                    display: 'flex', 
                    mb: 2, 
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box 
                    onClick={handlePlay}
                    sx={{ 
                        width: 160, 
                        flexShrink: 0, 
                        position: 'relative', 
                        cursor: 'pointer',
                        '&:hover .play-icon': { opacity: 1 }
                    }}
                >
                    <Box 
                        component="img" 
                        src={thumbnailUrl} 
                        alt="Video Thumbnail"
                        crossOrigin="anonymous"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box 
                        className="play-icon"
                        sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.3)',
                            opacity: 0.8,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <PlayArrowIcon sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            bgcolor: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            fontSize: '0.75rem',
                            px: 0.5,
                            borderRadius: 0.5
                        }}
                    >
                        {secondsToTime(link.start_time)}
                    </Box>
                </Box>

                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ flex: 1 }}>
                            {link.description || 'Pro Video Part'}
                        </Typography>

                        {canManage && (
                            <>
                                <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 1, mt: -0.5 }}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleEdit}>
                                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                                    </MenuItem>
                                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Stack>
                    
                    {link.skater_name && (
                        <Typography variant="body2" color="primary" fontWeight={700} sx={{ mt: 0.5 }}>
                            Skater: {link.skater_name}
                        </Typography>
                    )}
                    
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                            Added by @{link.author?.username || 'unknown'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton 
                                size="small" 
                                onClick={() => onLike(link.id, !!link.is_liked_by_user)}
                                disabled={!currentUserId}
                            >
                                {link.is_liked_by_user ? (
                                    <FavoriteIcon fontSize="small" color="error" />
                                ) : (
                                    <FavoriteBorderIcon fontSize="small" />
                                )}
                            </IconButton>
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {link.like_count || 0}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            <VideoPlayerModal
                open={isPlaying}
                onClose={handleClose}
                playerKey={playerKey}
                linkId={link.id}
                embedUrl={embedUrl}
                onReplay={handleReplay}
                youtubeUrl={`https://www.youtube.com/watch?v=${link.youtube_video_id}&t=${link.start_time || 0}s`}
            />

            {canManage && (
                <AddVideoLinkDialog
                    open={isEditDialogOpen}
                    onClose={() => setIsEditDialogOpen(false)}
                    spotId={link.spot_id}
                    userId={link.user_id}
                    onSuccess={onEditSuccess}
                    editLink={link}
                />
            )}
        </>
    );
};

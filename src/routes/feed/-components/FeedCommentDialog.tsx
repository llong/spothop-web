import { memo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    CircularProgress,
    Divider,
    Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useMediaComments, usePostMediaComment, useToggleCommentReaction } from 'src/hooks/useFeedQueries';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem } from 'src/types';

interface FeedCommentDialogProps {
    open: boolean;
    onClose: () => void;
    item: FeedItem;
    userId?: string;
}

export const FeedCommentDialog = memo(({
    open,
    onClose,
    item,
    userId
}: FeedCommentDialogProps) => {
    const { media_id: mediaId, media_type: mediaType } = item;
    const { data: comments, isLoading } = useMediaComments(mediaId, mediaType, userId);
    const postCommentMutation = usePostMediaComment();
    const toggleReactionMutation = useToggleCommentReaction();
    const [newComment, setNewComment] = useState('');

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || postCommentMutation.isPending) return;

        try {
            await postCommentMutation.mutateAsync({
                mediaId,
                mediaType,
                content: newComment.trim()
            });
            setNewComment('');
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const handleToggleReaction = (commentId: string) => {
        if (!userId) return;
        toggleReactionMutation.mutate({ commentId });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: 4, maxHeight: '80vh' }
            }}
        >
            <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={800} component="div">Comments</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <List sx={{ py: 0 }}>
                        {comments && comments.length > 0 ? (
                            comments.map((comment, index) => (
                                <Box key={comment.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
                                        <ListItemAvatar sx={{ minWidth: 48 }}>
                                            <Avatar
                                                src={comment.author?.avatarUrl || undefined}
                                                sx={{ width: 32, height: 32 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primaryTypographyProps={{ component: 'div' }}
                                            secondaryTypographyProps={{ component: 'div' }}
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        @{comment.author?.username || 'unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </Typography>
                                                </Stack>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.primary"
                                                        sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                                    >
                                                        {comment.content}
                                                    </Typography>
                                                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <IconButton
                                                                size="small"
                                                                sx={{ p: 0.5 }}
                                                                onClick={() => handleToggleReaction(comment.id)}
                                                            >
                                                                {comment.reactions?.userReaction === 'like' ? (
                                                                    <FavoriteIcon sx={{ fontSize: 16 }} color="error" />
                                                                ) : (
                                                                    <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                                                                )}
                                                            </IconButton>
                                                            <Typography variant="caption">
                                                                {comment.reactions?.likes || 0}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < comments.length - 1 && <Divider variant="inset" component="li" />}
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <Typography color="text.secondary">No comments yet.</Typography>
                            </Box>
                        )}
                    </List>
                )}
            </DialogContent>

            <Box component="form" onSubmit={handlePostComment} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={userId ? "Add a comment..." : "Log in to comment"}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!userId || postCommentMutation.isPending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 10,
                                bgcolor: 'grey.100',
                                '& fieldset': { border: 'none' }
                            }
                        }}
                    />
                    <IconButton
                        type="submit"
                        color="primary"
                        disabled={!newComment.trim() || !userId || postCommentMutation.isPending}
                    >
                        {postCommentMutation.isPending ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                </Stack>
            </Box>
        </Dialog>
    );
});
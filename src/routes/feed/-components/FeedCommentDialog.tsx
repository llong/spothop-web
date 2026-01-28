import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Stack,
    Avatar,
    IconButton,
    CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useMediaComments, usePostMediaComment } from 'src/hooks/useFeedQueries';
import { CommentForm } from 'src/routes/spots/-components/CommentForm';
import { formatDistanceToNow } from 'date-fns';

interface FeedCommentDialogProps {
    open: boolean;
    onClose: () => void;
    mediaId: string;
    mediaType: 'photo' | 'video';
    userId?: string;
}

export const FeedCommentDialog = ({
    open,
    onClose,
    mediaId,
    mediaType,
    userId
}: FeedCommentDialogProps) => {
    const { data: comments, isLoading } = useMediaComments(mediaId, mediaType);
    const postCommentMutation = usePostMediaComment();

    const handlePostComment = async (content: string) => {
        if (!userId) return { success: false, error: 'User not logged in' };

        try {
            await postCommentMutation.mutateAsync({
                userId,
                mediaId,
                mediaType,
                content
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to post comment:', error);
            return { success: false, error: 'Failed to post comment' };
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            scroll="paper"
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Comments
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={2} sx={{ py: 1 }}>
                        {comments?.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                No comments yet.
                            </Typography>
                        ) : (
                            comments?.map((comment) => (
                                <Box key={comment.id}>
                                    <Stack direction="row" spacing={2}>
                                        <Avatar
                                            src={comment.author?.avatarUrl || undefined}
                                            sx={{ width: 32, height: 32 }}
                                        />
                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="baseline">
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    @{comment.author?.username || 'unknown'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2">
                                                {comment.content}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, display: 'block' }}>
                {userId ? (
                    <CommentForm
                        onSubmit={handlePostComment}
                        placeholder="Add a comment..."
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" align="center">
                        Please log in to comment.
                    </Typography>
                )}
            </DialogActions>
        </Dialog>
    );
};

import { useEffect } from 'react';
import { Box, Typography, Divider, CircularProgress, Stack, Paper } from '@mui/material';
import { useComments } from 'src/hooks/useComments';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';

interface CommentSectionProps {
    spotId: string;
}

export const CommentSection = ({ spotId }: CommentSectionProps) => {
    const user = useAtomValue(userAtom);
    const {
        comments,
        loading,
        fetchComments,
        addComment,
        updateComment,
        deleteComment,
        toggleReaction
    } = useComments(spotId);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                Discussion
            </Typography>

            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                {user ? (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Leave a comment
                        </Typography>
                        <CommentForm
                            onSubmit={async (content) => addComment(content)}
                        />
                    </Box>
                ) : (
                    <Box sx={{ mb: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                        <Typography variant="body2" color="info.main">
                            Please log in to join the discussion.
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {loading && comments.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {comments.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                No comments yet. Be the first to share your thoughts!
                            </Typography>
                        ) : (
                            comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    onReply={addComment}
                                    onEdit={updateComment}
                                    onDelete={deleteComment}
                                    onReact={toggleReaction}
                                    currentUserId={user?.user.id}
                                />
                            ))
                        )}
                    </Stack>
                )}
            </Paper>
        </Box>
    );
};

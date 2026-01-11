
import { Box } from '@mui/material';
import { CommentForm } from './CommentForm';
import type { SpotComment } from 'src/types';

interface CommentRepliesProps {
    comment: SpotComment;
    onReply: (parentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
    isReplying: boolean;
    onReplyCancel: () => void;
}

export const CommentReplies = ({ comment, onReply, isReplying, onReplyCancel }: CommentRepliesProps) => {
    const handleReply = async (content: string) => {
        const result = await onReply(comment.id, content);
        if (result.success) {
            onReplyCancel();
        } else {
            alert(result.error || 'Failed to reply to comment');
        }
        return result;
    };

    return (
        <Box sx={{ ml: 6, mt: 1 }}>
            {isReplying && (
                <CommentForm
                    onSubmit={handleReply}
                    onCancel={onReplyCancel}
                    placeholder="Write a reply..."
                    submitLabel="Reply"
                />
            )}
            
            {comment.replies && comment.replies.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    {comment.replies.map((reply) => (
                        <Box key={reply.id} sx={{ mb: 2 }}>
                            {/* CommentItem will render the nested reply */}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};
import { IconButton, Stack } from '@mui/material';
import { ThumbUp, ThumbUpOutlined, ThumbDown, ThumbDownOutlined, Reply } from '@mui/icons-material';
import type { SpotComment } from 'src/types';

interface CommentActionsProps {
    comment: SpotComment;
    onReact: (commentId: string, type: 'like' | 'dislike') => Promise<{ success: boolean; error?: string }>;
    onReply: () => void;
}

export const CommentActions = ({ comment, onReact, onReply }: CommentActionsProps) => {
    const userReaction = comment.reactions?.userReaction;
    const isLiked = userReaction === 'like';
    const isDisliked = userReaction === 'dislike';
    const likeCount = comment.reactions?.likes || 0;
    const dislikeCount = comment.reactions?.dislikes || 0;

    const handleReact = async (type: 'like' | 'dislike') => {
        await onReact(comment.id, type);
    };

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
                size="small"
                onClick={() => handleReact('like')}
                color={isLiked ? 'primary' : 'default'}
            >
                {isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
            </IconButton>
            {likeCount > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'text.secondary' }}>{likeCount}</span>
            )}
            
            <IconButton
                size="small"
                onClick={() => handleReact('dislike')}
                color={isDisliked ? 'error' : 'default'}
            >
                {isDisliked ? <ThumbDown /> : <ThumbDownOutlined />}
            </IconButton>
            {dislikeCount > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'text.secondary' }}>{dislikeCount}</span>
            )}
            
            <IconButton size="small" onClick={onReply}>
                <Reply />
            </IconButton>
        </Stack>
    );
};
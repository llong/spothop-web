import { Box, Typography, Avatar, Stack } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { Link } from '@tanstack/react-router';
import type { SpotComment } from 'src/types';

interface CommentDisplayProps {
    comment: SpotComment;
    isReply?: boolean;
}

export const CommentDisplay = ({ comment, isReply = false }: CommentDisplayProps) => {
    if (!comment.author) return null;

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Link to="/profile/$username" params={{ username: comment.author.username || 'unknown' }} style={{ textDecoration: 'none' }}>
                <Avatar
                    src={comment.author.avatarUrl || undefined}
                    sx={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
                />
            </Link>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Link to="/profile/$username" params={{ username: comment.author.username || 'unknown' }} style={{ textDecoration: 'none' }}>
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                            @{comment.author.username || 'unknown'}
                        </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {comment.content}
                </Typography>
            </Box>
        </Box>
    );
};
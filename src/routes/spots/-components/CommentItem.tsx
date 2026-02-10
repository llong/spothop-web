import { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    Avatar,
    IconButton,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';
import {
    ThumbUp,
    ThumbUpOutlined,
    ThumbDown,
    ThumbDownOutlined,
    Reply,
    MoreVert,
    Edit,
    Delete,
    FlagOutlined
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Link } from '@tanstack/react-router';
import type { SpotComment } from 'src/types';
import { CommentForm } from './CommentForm';
import { ReportDialog } from './ReportDialog';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useProfileQuery } from 'src/hooks/useProfileQueries';

interface CommentItemProps {
    comment: SpotComment;
    onReply: (parentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
    onEdit: (commentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
    onDelete: (commentId: string) => Promise<{ success: boolean; error?: string }>;
    onReact: (commentId: string, type: 'like' | 'dislike') => Promise<{ success: boolean; error?: string }>;
    currentUserId?: string;
    isReply?: boolean;
}

export const CommentItem = ({
    comment,
    onReply,
    onEdit,
    onDelete,
    onReact,
    currentUserId,
    isReply = false
}: CommentItemProps) => {
    const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [reportOpen, setReportOpen] = useState(false);

    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);
    const isAdmin = profile?.role === 'admin';
    const isAuthor = currentUserId === comment.user_id;

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditStart = () => {
        setEditing(true);
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            await onDelete(comment.id);
        }
        handleMenuClose();
    };

    return (
        <Box sx={{ mb: 2, pl: isReply ? 6 : 0 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Link
                    to="/profile/$username"
                    params={{ username: comment.author?.username || 'unknown' }}
                    style={{ textDecoration: 'none' }}
                >
                    <Avatar
                        src={comment.author?.avatarUrl || undefined}
                        sx={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
                    />
                </Link>

                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 2, position: 'relative' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Link
                                to="/profile/$username"
                                params={{ username: comment.author?.username || 'unknown' }}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <Typography variant="subtitle2" fontWeight={700}>
                                    @{comment.author?.username || 'unknown'}
                                </Typography>
                            </Link>
                            <IconButton size="small" onClick={handleMenuOpen}>
                                <MoreVert fontSize="small" />
                            </IconButton>
                        </Stack>

                        {editing ? (
                            <CommentForm
                                initialValue={comment.content}
                                onSubmit={async (content) => {
                                    const res = await onEdit(comment.id, content);
                                    if (res.success) setEditing(false);
                                    return res;
                                }}
                                onCancel={() => setEditing(false)}
                                submitLabel="Save"
                            />
                        ) : (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                {comment.is_edited && ' (edited)'}
                            </Typography>
                        </Stack>
                    </Box>

                    {/* Actions Row */}
                    {!editing && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Stack direction="row" alignItems="center">
                                <Tooltip title="Like">
                                    <IconButton size="small" onClick={() => onReact(comment.id, 'like')}>
                                        {comment.reactions?.userReaction === 'like' ?
                                            <ThumbUp fontSize="inherit" color="primary" /> :
                                            <ThumbUpOutlined fontSize="inherit" />
                                        }
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="caption">{comment.reactions?.likes || 0}</Typography>
                            </Stack>

                            <Stack direction="row" alignItems="center">
                                <Tooltip title="Dislike">
                                    <IconButton size="small" onClick={() => onReact(comment.id, 'dislike')}>
                                        {comment.reactions?.userReaction === 'dislike' ?
                                            <ThumbDown fontSize="inherit" color="error" /> :
                                            <ThumbDownOutlined fontSize="inherit" />
                                        }
                                    </IconButton>
                                </Tooltip>
                                <Typography variant="caption">{comment.reactions?.dislikes || 0}</Typography>
                            </Stack>

                            {currentUserId && (
                                <Button
                                    size="small"
                                    startIcon={<Reply fontSize="small" />}
                                    onClick={() => setReplying(!replying)}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                >
                                    Reply
                                </Button>
                            )}
                        </Stack>
                    )}

                    {replying && (
                        <CommentForm
                            placeholder={`Reply to @${comment.author?.username}...`}
                            onSubmit={async (content) => {
                                // Important: onReply maps to addComment(content, parentId)
                                const res = await onReply(content, comment.id);
                                if (res.success) setReplying(false);
                                return res;
                            }}
                            onCancel={() => setReplying(false)}
                            autoFocus
                        />
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {comment.replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onReact={onReact}
                                    currentUserId={currentUserId}
                                    isReply
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Stack>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {isAuthor && (
                    <MenuItem key="edit" onClick={handleEditStart}>
                        <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                    </MenuItem>
                )}

                {(isAuthor || isAdmin) && (
                    <MenuItem key="delete" onClick={handleDelete} sx={{ color: 'error.main' }}>
                        <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>{isAdmin && !isAuthor ? 'Delete (Admin)' : 'Delete'}</ListItemText>
                    </MenuItem>
                )}

                {(!isAuthor && !isAdmin) && (
                    <MenuItem key="report" onClick={() => { setReportOpen(true); handleMenuClose(); }}>
                        <ListItemIcon><FlagOutlined fontSize="small" /></ListItemIcon>
                        <ListItemText>Report</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetId={comment.id}
                targetType="comment"
                targetName={`comment by @${comment.author?.username}`}
                onSuccess={() => { }}
            />
        </Box>
    );
};

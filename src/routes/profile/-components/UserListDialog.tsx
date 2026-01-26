import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Button,
    Box,
    CircularProgress,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from '@tanstack/react-router';
import { useUserFollowersQuery, useUserFollowingQuery } from '../../../hooks/useProfileQueries';
import { getOptimizedImageUrl } from '../../../utils/imageOptimization';

interface UserListDialogProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

export const UserListDialog: React.FC<UserListDialogProps> = ({ open, onClose, userId, type }) => {
    const navigate = useNavigate();

    const followersQuery = useUserFollowersQuery(type === 'followers' ? userId : undefined);
    const followingQuery = useUserFollowingQuery(type === 'following' ? userId : undefined);

    const query = type === 'followers' ? followersQuery : followingQuery;

    const users = query.data?.pages.flatMap(page => page.items) || [];
    const isLoading = query.isLoading;
    const hasNextPage = query.hasNextPage;
    const isFetchingNextPage = query.isFetchingNextPage;

    const handleUserClick = (username: string) => {
        onClose();
        navigate({ to: '/profile/$username', params: { username } });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                    {type === 'followers' ? 'Followers' : 'Following'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : users.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No {type} yet.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 0 }}>
                        {users.map((user) => (
                            <ListItem key={user.user_id} disablePadding>
                                <ListItemButton
                                    onClick={() => handleUserClick(user.username)}
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={user.avatar_url ? getOptimizedImageUrl(user.avatar_url) : ""} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography fontWeight={600}>@{user.username}</Typography>}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        {hasNextPage && (
                            <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                                <Button
                                    onClick={() => query.fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    size="small"
                                >
                                    {isFetchingNextPage ? <CircularProgress size={20} /> : 'Load More'}
                                </Button>
                            </ListItem>
                        )}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
};

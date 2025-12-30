import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Container, Typography, Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Paper, IconButton, Button, Stack, Tooltip, ListItemButton } from '@mui/material';
import {
    ChatBubbleOutline,
    CheckCircleOutline,
    FavoriteBorder,
    ImageOutlined,
    DeleteOutline,
    Done
} from '@mui/icons-material';
import { useNotifications } from 'src/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import supabase from 'src/supabase';

const NotificationsComponent = () => {
    const { notifications = [], loading, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = async (notification: any) => {
        await markAsRead(notification.id);

        // Redirect based on context or entity
        const spotId = notification.context_id || (notification.entity_type === 'spot' ? notification.entity_id : null);

        if (spotId) {
            navigate({ to: '/spots/$spotId', params: { spotId } });
        }
    };

    const renderNotificationText = (notification: any) => {
        const actor = <strong>@{notification.actor?.username}</strong>;

        switch (notification.type) {
            case 'reply':
                return <>{actor} replied to your comment</>;
            case 'like_spot':
                return <>{actor} added your spot to favorites</>;
            case 'like_media':
                return <>{actor} liked your {notification.entity_type === 'media' ? 'photo/video' : 'content'}</>;
            case 'comment':
                return <>{actor} commented on your spot</>;
            default:
                return <>{actor} interacted with your content</>;
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'reply':
            case 'comment':
                return <ChatBubbleOutline />;
            case 'like_spot':
                return <FavoriteBorder color="error" />;
            case 'like_media':
                return <ImageOutlined color="primary" />;
            default:
                return <ChatBubbleOutline />;
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <Typography>Loading notifications...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Stay updated with replies to your comments
                    </Typography>
                </Box>
                {notifications.some(n => !n.is_read) && (
                    <Button
                        startIcon={<CheckCircleOutline />}
                        onClick={() => markAllAsRead()}
                        disabled={loading}
                    >
                        Mark all as read
                    </Button>
                )}
            </Stack>

            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            You don't have any notifications yet.
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                sx={{
                                    py: 1,
                                    px: 0,
                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    '&:last-child': { borderBottom: 0 }
                                }}
                            >
                                <ListItemButton onClick={() => handleNotificationClick(notification)} sx={{ py: 2, px: 3 }}>
                                    <ListItemAvatar>
                                        <Avatar
                                            src={notification.actor?.avatarUrl || undefined}
                                            sx={{ width: 48, height: 48 }}
                                        >
                                            {getNotificationIcon(notification.type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1">
                                                {renderNotificationText(notification)}
                                            </Typography>
                                        }
                                        secondary={
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </Typography>
                                            </Stack>
                                        }
                                    />
                                </ListItemButton>

                                <Box sx={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                                    <Stack direction="row" spacing={1}>
                                        {!notification.is_read && (
                                            <Tooltip title="Mark as read">
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                >
                                                    <Done fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
};

export const Route = createFileRoute('/notifications/')({
    component: NotificationsComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({ to: '/login' });
        }
    },
});

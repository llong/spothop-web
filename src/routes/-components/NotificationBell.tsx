import { useState } from 'react';
import { IconButton, Badge, Menu, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Box, Button, Tooltip, Stack, ListItemButton } from '@mui/material';
import {
    Notifications as NotificationsIcon,
    ChatBubbleOutline,
    FavoriteBorder,
    ImageOutlined,
    Done,
    DeleteOutline
} from '@mui/icons-material';
import { useNotifications } from 'src/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from '@tanstack/react-router';

export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification: any) => {
        await markAsRead(notification.id);
        handleClose();

        // Redirect based on context or entity
        const spotId = notification.context_id || (notification.entity_type === 'spot' ? notification.entity_id : null);

        if (spotId) {
            navigate({ to: '/spots/$spotId', params: { spotId } });
        } else {
            navigate({ to: '/notifications' });
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
                return <ChatBubbleOutline fontSize="small" />;
            case 'like_spot':
                return <FavoriteBorder fontSize="small" color="error" />;
            case 'like_media':
                return <ImageOutlined fontSize="small" color="primary" />;
            default:
                return <NotificationsIcon fontSize="small" />;
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400, mt: 1.5 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead}>Mark all read</Button>
                    )}
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.slice(0, 5).map((notification) => (
                            <ListItem
                                key={notification.id}
                                disablePadding
                                divider
                                sx={{
                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    '&:hover': { bgcolor: 'action.selected' }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 1 }}>
                                    <ListItemButton onClick={() => handleNotificationClick(notification)} sx={{ py: 1 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                src={notification.actor?.avatarUrl || undefined}
                                                sx={{ width: 32, height: 32 }}
                                            >
                                                {getNotificationIcon(notification.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                                                    {renderNotificationText(notification)}
                                                </Typography>
                                            }
                                            secondary={formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        />
                                    </ListItemButton>

                                    <Stack direction="row">
                                        {!notification.is_read && (
                                            <Tooltip title="Mark as read">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                >
                                                    <Done fontSize="inherit" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                            >
                                                <DeleteOutline fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Link to="/notifications" onClick={handleClose} style={{ textDecoration: 'none' }}>
                        <Button fullWidth size="small">View all notifications</Button>
                    </Link>
                </Box>
            </Menu>
        </>
    );
};

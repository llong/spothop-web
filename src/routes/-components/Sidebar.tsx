import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Button, Stack, Avatar } from '@mui/material';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { AccountCircle, ChatBubble, Notifications, DynamicFeed, Shield, Logout, Explore, Login, EmojiEvents } from '@mui/icons-material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import supabase from 'src/supabase';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { useMediaQuery, useTheme } from '@mui/material';

export function Sidebar() {
    const muiTheme = useTheme();
    const isMini = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));
    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Feed', to: '/feed', icon: <DynamicFeed /> },
        { label: 'Spots', to: '/spots', icon: <Explore /> },
        { label: 'Contests', to: '/contests', icon: <EmojiEvents /> },
        { label: 'Inbox', to: '/chat', icon: <ChatBubble />, authRequired: true },
        { label: 'Alerts', to: '/notifications', icon: <Notifications />, authRequired: true },
        { label: 'Profile', to: '/profile', icon: <AccountCircle />, authRequired: true },
    ];

    if (user && profile?.role === 'admin') {
        menuItems.splice(2, 0, { label: 'Admin', to: '/admin', icon: <Shield />, authRequired: true });
    }

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login?message=logged_out';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 3
        }}>
            <Typography
                variant="h5"
                fontWeight={900}
                sx={{ 
                    mb: 4, 
                    px: 2, 
                    cursor: 'pointer', 
                    color: 'primary.main',
                    textAlign: isMini ? 'center' : 'left'
                }}
                onClick={() => navigate({ to: '/feed' })}
            >
                {isMini ? 'S' : 'SpotHop'}
            </Typography>

            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => {
                    if (item.authRequired && !user) return null;

                    const isActive = location.pathname.startsWith(item.to);

                    return (
                        <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                component={Link}
                                to={item.to}
                                sx={{
                                    borderRadius: 10,
                                    py: 1.5,
                                    bgcolor: isActive ? 'rgba(29, 155, 240, 0.1)' : 'transparent',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.05)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: isMini ? 0 : 45,
                                    color: isActive ? 'primary.main' : 'inherit',
                                    justifyContent: 'center'
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                {!isMini && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: isActive ? 900 : 500,
                                            fontSize: '1.1rem',
                                            color: isActive ? 'primary.main' : 'inherit'
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ mt: 'auto', p: isMini ? 0 : 2 }}>
                {user ? (
                    <Stack spacing={2} alignItems="center">
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                                borderRadius: isMini ? '50%' : 10,
                                minWidth: isMini ? 48 : 'auto',
                                width: isMini ? 48 : '100%',
                                height: isMini ? 48 : 'auto',
                                py: isMini ? 0 : 1.5,
                                fontWeight: 900,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                boxShadow: 'none'
                            }}
                            onClick={() => navigate({ to: '/spots' })}
                        >
                            {isMini ? '+' : 'Post'}
                        </Button>

                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mt: 2, 
                            cursor: 'pointer',
                            flexDirection: isMini ? 'column' : 'row'
                        }} onClick={() => navigate({ to: '/profile' })}>
                            <Avatar src={profile?.avatarUrl || undefined} />
                            {!isMini && (
                                <>
                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                                            {profile?.displayName || user.user.email}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                            @{profile?.username || 'user'}
                                        </Typography>
                                    </Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSignOut(); }}>
                                        <Logout fontSize="small" />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    </Stack>
                ) : (
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        component={Link}
                        to="/login"
                        startIcon={<Login />}
                        sx={{ 
                            borderRadius: isMini ? '50%' : 10,
                            minWidth: isMini ? 48 : 'auto',
                            width: isMini ? 48 : '100%',
                            height: isMini ? 48 : 'auto',
                            py: isMini ? 0 : 1.5,
                            fontWeight: 900 
                        }}
                    >
                        {!isMini && 'Login'}
                    </Button>
                )}
            </Box>
        </Box>
    );
}

import { IconButton } from '@mui/material';
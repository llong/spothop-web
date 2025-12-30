import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, AccountCircle, ChatBubble, Notifications } from '@mui/icons-material';
import { Link, useLocation } from '@tanstack/react-router';

export const BottomNav = () => {
    const location = useLocation();

    const menuItems = [
        { label: 'Spots', to: '/', icon: <Home /> },
        { label: 'Inbox', to: '/chat', icon: <ChatBubble /> },
        { label: 'Alerts', to: '/notifications', icon: <Notifications /> },
        { label: 'Profile', to: '/profile', icon: <AccountCircle /> },
    ];

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={location.pathname}
            >
                {menuItems.map((item) => (
                    <BottomNavigationAction
                        key={item.label}
                        label={item.label}
                        value={item.to}
                        icon={item.icon}
                        component={Link}
                        to={item.to}
                    />
                ))}
            </BottomNavigation>
        </Paper>
    );
};

import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, AccountCircle, ChatBubble, Notifications, DynamicFeed } from '@mui/icons-material';
import { Link, useLocation } from '@tanstack/react-router';
import { useAtomValue } from 'jotai'; // Import useAtomValue
import { userAtom } from 'src/atoms/auth'; // Import userAtom

export const BottomNav = () => {
    const location = useLocation();
    const auth = useAtomValue(userAtom); // Get user authentication status

    // Define menu items, conditional on auth status
    const menuItems = [
        { label: 'Feed', to: '/feed', icon: <DynamicFeed /> },
        { label: 'Spots', to: '/spots', icon: <Home /> },
        ...(auth?.user ? [ // Only show for logged-in users
            { label: 'Inbox', to: '/chat', icon: <ChatBubble /> },
            { label: 'Alerts', to: '/notifications', icon: <Notifications /> },
        ] : []),
        { 
            label: auth?.user ? 'Profile' : 'Sign In', // Change label based on auth status
            to: auth?.user ? '/profile' : '/login', // Change route based on auth status
            icon: <AccountCircle /> 
        },
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

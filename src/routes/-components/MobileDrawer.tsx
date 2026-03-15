import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Notifications, Login, Logout, DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material';
import { useAtom, useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import supabase from 'src/supabase';
import { themeModeAtom } from 'src/atoms/ui';

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
    const user = useAtomValue(userAtom);
    const [themeMode, setThemeMode] = useAtom(themeModeAtom);

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login?message=logged_out';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleThemeToggle = () => {
        if (themeMode === 'light') setThemeMode('dark');
        else if (themeMode === 'dark') setThemeMode('system');
        else setThemeMode('light');
    };

    const getThemeIcon = () => {
        if (themeMode === 'light') return <LightMode />;
        if (themeMode === 'dark') return <DarkMode />;
        return <SettingsBrightness />;
    };

    const getThemeLabel = () => {
        if (themeMode === 'light') return 'Light Mode';
        if (themeMode === 'dark') return 'Dark Mode';
        return 'System Theme';
    };

    return (
        <Drawer anchor="left" open={open} onClose={onClose}>
            <Box sx={{ width: 250 }} role="presentation">
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        Settings
                    </Typography>
                </Box>
                <Divider />
                <List onClick={onClose} onKeyDown={onClose}>
                    {user?.user.aud && (
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/notifications">
                                <ListItemIcon>
                                    <Notifications />
                                </ListItemIcon>
                                <ListItemText primary="Alerts" />
                            </ListItemButton>
                        </ListItem>
                    )}

                    <ListItem disablePadding>
                        <ListItemButton onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleThemeToggle();
                            // Don't close drawer on theme toggle
                        }}>
                            <ListItemIcon>
                                {getThemeIcon()}
                            </ListItemIcon>
                            <ListItemText primary={getThemeLabel()} />
                        </ListItemButton>
                    </ListItem>

                    {user?.user.aud ? (
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleSignOut}>
                                <ListItemIcon>
                                    <Logout />
                                </ListItemIcon>
                                <ListItemText primary="Sign Out" />
                            </ListItemButton>
                        </ListItem>
                    ) : (
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/login">
                                <ListItemIcon>
                                    <Login />
                                </ListItemIcon>
                                <ListItemText primary="Sign In" />
                            </ListItemButton>
                        </ListItem>
                    )}
                </List>
            </Box>
        </Drawer>
    );
}

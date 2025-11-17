import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Home, AccountCircle, Login, Logout } from '@mui/icons-material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import supabase from 'src/supabase';

interface DrawerMenuProps {
    open: boolean;
    onClose: () => void;
}

export const DrawerMenu = ({ open, onClose }: DrawerMenuProps) => {
    const user = useAtomValue(userAtom);

    const menuItems = [
        { text: 'Spots', to: '/', icon: <Home /> },
        { text: 'Profile', to: '/profile', icon: <AccountCircle /> },
    ];

    return (
        <Drawer anchor="left" open={open} onClose={onClose}>
            <List sx={{ width: 250 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={Link} to={item.to} onClick={onClose}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
                <Divider />
                {user?.user.aud ? (
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => {
                            supabase.auth.signOut();
                            onClose();
                        }}>
                            <ListItemIcon><Logout /></ListItemIcon>
                            <ListItemText primary="Sign Out" />
                        </ListItemButton>
                    </ListItem>
                ) : (
                    <ListItem disablePadding>
                        <ListItemButton component={Link} to="/login" onClick={onClose}>
                            <ListItemIcon><Login /></ListItemIcon>
                            <ListItemText primary="Login" />
                        </ListItemButton>
                    </ListItem>
                )}
            </List>
        </Drawer>
    );
};

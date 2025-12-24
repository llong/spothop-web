import { Stack, Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Home, AccountCircle, Login, Logout } from '@mui/icons-material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import supabase from 'src/supabase';

export function NavigationItems() {
    const user = useAtomValue(userAtom);

    return (
        <Stack direction="row" spacing={2}>
            <Button color="inherit" component={Link} to="/" startIcon={<Home />}>
                Spots
            </Button>
            <Button color="inherit" component={Link} to="/profile" startIcon={<AccountCircle />}>
                Profile
            </Button>
            {!user?.user.aud ? (
                <Button color="inherit" component={Link} to="/login" startIcon={<Login />}>
                    Login
                </Button>
            ) : (
                <Button color="inherit" onClick={() => supabase.auth.signOut()} startIcon={<Logout />}>
                    Sign Out
                </Button>
            )}
        </Stack>
    );
}

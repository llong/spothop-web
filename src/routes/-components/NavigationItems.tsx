import { Stack, Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Home, AccountCircle, Login, Logout, ChatBubble, Shield, DynamicFeed } from '@mui/icons-material';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import supabase from 'src/supabase';
import { useProfileQuery } from 'src/hooks/useProfileQueries';

export function NavigationItems() {
    const user = useAtomValue(userAtom);
    const { data: profile } = useProfileQuery(user?.user.id);

    return (
        <Stack direction="row" spacing={2}>
            <Button color="inherit" component={Link} to="/feed" startIcon={<DynamicFeed />}>
                Feed
            </Button>

            <Button color="inherit" component={Link} to="/spots" startIcon={<Home />}>
                Spots
            </Button>

            {user?.user.aud && (
                <>
                    {profile?.role === 'admin' && (
                        <Button color="inherit" component={Link} to="/admin" startIcon={<Shield />}>
                            Admin
                        </Button>
                    )}
                    <Button color="inherit" component={Link} to="/profile" startIcon={<AccountCircle />}>
                        Profile
                    </Button>
                    <Button color="inherit" component={Link} to="/chat" startIcon={<ChatBubble />}>
                        Inbox
                    </Button>
                </>
            )}
            {!user?.user.aud ? (
                <Button color="inherit" component={Link} to="/login" startIcon={<Login />}>
                    Login
                </Button>
            ) : (
                <Button
                    color="inherit"
                    onClick={async () => {
                        try {
                            await supabase.auth.signOut();
                        } finally {
                            window.location.href = '/login?message=logged_out';
                        }
                    }}
                    startIcon={<Logout />}
                >
                    Sign Out
                </Button>
            )}
        </Stack>
    );
}

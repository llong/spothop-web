import { Stack, Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Home, AccountCircle, Login, Logout, ChatBubble } from '@mui/icons-material';
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

            {user?.user.aud && (
                <>
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

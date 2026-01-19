import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { AppBar, Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material'
import { useEffect } from 'react'
import { useSetAtom, useAtomValue, useAtom } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import supabase from 'src/supabase'
import { useDevtools } from 'src/hooks/useDevTools'
import SearchAppBar from './-components/SearchAppBar'
import { BottomNav } from './-components/BottomNav'
import { useProfileQuery } from 'src/hooks/useProfileQueries'
import { globalToastAtom } from 'src/hooks/useNotifications'
import { Snackbar, Alert } from '@mui/material'
import { useLoadScript } from '@react-google-maps/api'
import { isGoogleMapsLoadedAtom } from 'src/atoms/map'
import { useMemo } from 'react'

export function RootComponent() {
    const setIsGoogleMapsLoaded = useSetAtom(isGoogleMapsLoadedAtom);
    const libraries = useMemo(() => ["places"], []);
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: libraries as any,
    });

    useEffect(() => {
        setIsGoogleMapsLoaded(isLoaded);
    }, [isLoaded, setIsGoogleMapsLoaded]);
    useDevtools();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const setUser = useSetAtom(userAtom);
    const auth = useAtomValue(userAtom);
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useAtom(globalToastAtom);

    // 1. STABLE AUTH LISTENER
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(prev => {
                // Only update if session ID actually changed
                if (session?.access_token === prev?.session?.access_token) return prev;

                if (session) {
                    return {
                        user: session.user,
                        session,
                    };
                }
                return null;
            });
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser])

    // 2. PASSIVE PROFILE ACCESS (No refetching in Root)
    const { data: profile, isLoading: isProfileLoading } = useProfileQuery(auth?.user.id);

    // Onboarding Guard
    useEffect(() => {
        // Skip check if user is not logged in or profile is still loading
        if (!auth || isProfileLoading || !profile) return;

        const isPublicPage = ['/login', '/signup', '/forgot-password', '/update-password', '/welcome'].includes(location.pathname);
        const isWelcomePage = location.pathname === '/welcome';

        // Redirection logic: If authenticated but no display name, force /welcome
        if (!profile.displayName && !isPublicPage) {
            navigate({ to: '/welcome' });
        }

        // Anti-Loop: If profile IS complete but user is on /welcome, send them home
        if (profile.displayName && isWelcomePage) {
            navigate({ to: '/' });
        }
    }, [auth, !!profile?.displayName, isProfileLoading, location.pathname, navigate]);

    return (
        <>
            <CssBaseline />
            <style>
                {`
                    .pac-container {
                        z-index: 1300 !important;
                    }
                    .pac-logo:after {
                        display: none;
                    }
                `}
            </style>
            <AppBar position="sticky" sx={{ backgroundColor: 'white', color: 'black' }}>
                <SearchAppBar />
            </AppBar>
            <Box
                component="main"
                sx={{
                    pb: isMobile ? 9 : 0,
                    animation: 'fade-in 0.3s ease-out',
                    '@keyframes fade-in': {
                        '0%': { opacity: 0, transform: 'translateY(5px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                    }
                }}
            >
                <Outlet />
            </Box>
            {isMobile && <BottomNav />}

            <Snackbar
                open={!!toast?.open}
                autoHideDuration={6000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast(null)}
                    severity="info"
                    variant="filled"
                    sx={{ width: '100%', cursor: toast?.conversationId ? 'pointer' : 'default' }}
                    onClick={() => {
                        if (toast?.conversationId) {
                            navigate({ to: '/chat/$conversationId', params: { conversationId: toast.conversationId } });
                            setToast(null);
                        }
                    }}
                >
                    {toast?.message}
                </Alert>
            </Snackbar>
        </>
    )
}

export const Route = createRootRoute({
    component: RootComponent,
})

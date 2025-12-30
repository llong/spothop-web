import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { AppBar, Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material'
import { useEffect } from 'react'
import { useSetAtom, useAtomValue } from 'jotai'
import { userAtom, profileAtom } from 'src/atoms/auth'
import supabase from 'src/supabase'
import { useDevtools } from 'src/hooks/useDevTools'
import SearchAppBar from './-components/SearchAppBar'
import { BottomNav } from './-components/BottomNav'
import { useProfileQuery } from 'src/hooks/useProfileQueries'

export function RootComponent() {
    useDevtools();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const setUser = useSetAtom(userAtom);
    const auth = useAtomValue(userAtom);
    const location = useLocation();
    const navigate = useNavigate();

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
            <Box sx={{ pb: isMobile ? 9 : 0 }}>
                <Outlet />
            </Box>
            {isMobile && <BottomNav />}
        </>
    )
}

export const Route = createRootRoute({
    component: RootComponent,
})

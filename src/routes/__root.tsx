import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { AppBar, Box, CssBaseline, useMediaQuery, ThemeProvider } from '@mui/material'
import { theme } from 'src/theme'
import { useEffect } from 'react'
import { useSetAtom, useAtomValue, useAtom } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import supabase from 'src/supabase'
import { useDevtools } from 'src/hooks/useDevTools'
import SearchAppBar from './-components/SearchAppBar'
import { BottomNav } from './-components/BottomNav'
import { Sidebar } from './-components/Sidebar'
import { useProfileQuery } from 'src/hooks/useProfileQueries'
import { globalToastAtom } from 'src/hooks/useNotifications'
import { rightSidebarAtom } from 'src/atoms/ui'
import { Snackbar, Alert } from '@mui/material'
import { useLoadScript } from '@react-google-maps/api'
import { isGoogleMapsLoadedAtom } from 'src/atoms/map'
import { useMemo } from 'react'
import { analytics } from 'src/lib/posthog'

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

    const isDesktop = useMediaQuery('(min-width:1200px)');
    const isTablet = useMediaQuery('(min-width:600px) and (max-width:1199px)');
    const isMobile = useMediaQuery('(max-width:599px)');

    const setUser = useSetAtom(userAtom);
    const auth = useAtomValue(userAtom);
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useAtom(globalToastAtom);
    const rightSidebarContent = useAtomValue(rightSidebarAtom);

    // Track page views
    useEffect(() => {
        analytics.capture('$pageview');
    }, [location.pathname]);

    // 1. STABLE AUTH LISTENER
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(prev => {
                if (session?.access_token === prev?.session?.access_token) return prev;
                if (session) {
                    // Identify user in PostHog
                    analytics.identify(session.user.id, {
                        email: session.user.email
                    });
                    
                    return {
                        user: session.user,
                        session,
                    };
                }
                // Reset PostHog user
                analytics.reset();
                return null;
            });
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser])

    const { data: profile, isLoading: isProfileLoading } = useProfileQuery(auth?.user.id);

    useEffect(() => {
        if (!auth || isProfileLoading || !profile) return;
        const isPublicPage = ['/login', '/signup', '/forgot-password', '/update-password', '/welcome'].includes(location.pathname);
        const isWelcomePage = location.pathname === '/welcome';
        if (!profile.displayName && !isPublicPage) {
            navigate({ to: '/welcome' });
        }
        if (profile.displayName && isWelcomePage) {
            navigate({ to: '/feed' });
        }
    }, [auth, !!profile?.displayName, isProfileLoading, location.pathname, navigate]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <style>
                {`
                    .pac-container {
                        z-index: 1300 !important;
                    }
                    .pac-logo:after {
                        display: none;
                    }
                    @keyframes fade-in {
                        0% { opacity: 0; transform: translateY(5px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>

            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', justifyContent: 'center' }}>
                {/* Sidebar (Tablet and Desktop) */}
                {!isMobile && (
                    <Box sx={{
                        width: { sm: 80, md: 275, lg: 275, xl: 300 },
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        position: 'sticky',
                        top: 0,
                        height: '100vh'
                    }}>
                        <Sidebar />
                    </Box>
                )}

                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: (isDesktop && location.pathname !== '/spots') ? 600 : (isTablet ? 700 : 'none'),
                    width: '100%',
                    borderLeft: !isMobile ? '1px solid' : 'none',
                    borderRight: isDesktop ? '1px solid' : 'none',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden'
                }}>
                    {/* Mobile/Tablet AppBar */}
                    {!isDesktop && (
                        <AppBar position="sticky" elevation={0} sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(12px)',
                            color: 'black',
                        }}>
                            <SearchAppBar />
                        </AppBar>
                    )}

                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            pb: isMobile ? 8 : 0,
                            animation: 'fade-in 0.3s ease-out',
                        }}
                    >
                        <Outlet />
                    </Box>
                </Box>

                {/* Right Column (Desktop only) */}
                {isDesktop && (
                    <Box sx={{
                        width: { lg: 350, xl: 400 },
                        flexShrink: 0,
                        position: 'sticky',
                        top: 0,
                        height: '100vh',
                        overflowY: 'auto'
                    }}>
                        {rightSidebarContent}
                    </Box>
                )}
            </Box>

            {/* Mobile Bottom Navigation */}
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
        </ThemeProvider>
    )
}

export const Route = createRootRoute({
    component: RootComponent,
})
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppBar, Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material'
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import supabase from 'src/supabase'
import { useDevtools } from 'src/hooks/useDevTools'
import SearchAppBar from './-components/SearchAppBar'
import { BottomNav } from './-components/BottomNav'

export function RootComponent() {
    useDevtools();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const setUser = useSetAtom(userAtom)


    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({
                    user: session.user,
                    session,
                });
            } else {
                setUser(null);
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser])

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

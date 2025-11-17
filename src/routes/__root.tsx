import { createRootRoute, Outlet } from '@tanstack/react-router'
import { CssBaseline } from '@mui/material'
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { userAtom } from 'src/atoms/auth'
import supabase from 'src/supabase'
import { useDevtools } from 'src/hooks/useDevTools'
import SearchAppBar from './-components/SearchAppBar'

function RootComponent() {
    useDevtools();
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
            <SearchAppBar />
            <Outlet />
        </>
    )
}

export const Route = createRootRoute({
    component: RootComponent,
})

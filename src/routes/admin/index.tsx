import { createFileRoute, redirect } from '@tanstack/react-router'
import supabase from '../../supabase'

export const Route = createFileRoute('/admin/')({
    beforeLoad: async ({ location }) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }

        // Check for admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            throw redirect({
                to: '/',
            })
        }
    },
})

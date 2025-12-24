import { createFileRoute } from '@tanstack/react-router'
import { UpdatePasswordForm } from './-components/UpdatePasswordForm'

export const Route = createFileRoute('/update-password/')({
    component: UpdatePasswordForm,
})

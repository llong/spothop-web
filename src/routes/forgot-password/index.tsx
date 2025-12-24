import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from './-components/ForgotPasswordForm'

export const Route = createFileRoute('/forgot-password/')({
    component: ForgotPasswordForm,
})

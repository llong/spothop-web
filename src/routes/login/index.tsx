import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from './-components/LoginForm'

function LoginComponent() {
    return <LoginForm />
}

export const Route = createFileRoute('/login/')({
    component: LoginComponent,
})



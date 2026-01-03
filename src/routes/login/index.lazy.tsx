import { createLazyFileRoute } from '@tanstack/react-router'
import { LoginForm } from './-components/LoginForm'

export const Route = createLazyFileRoute('/login/')({
    component: LoginComponent,
})

function LoginComponent() {
    return <LoginForm />
}

import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from './-components/SignupForm'

export const Route = createFileRoute('/signup/')({
    component: SignupComponent,
})

function SignupComponent() {
    return <SignupForm />
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/spots/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/spots/"!</div>
}

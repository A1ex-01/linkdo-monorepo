import { createFileRoute } from '@tanstack/react-router'

function Home() {
  return <div>Home</div>
}

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

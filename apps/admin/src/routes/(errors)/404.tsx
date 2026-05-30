import { createFileRoute } from '@tanstack/react-router'
import { NotFoundError } from './_components/not-found-error'

export const Route = createFileRoute('/(errors)/404')({
  component: NotFoundError,
})

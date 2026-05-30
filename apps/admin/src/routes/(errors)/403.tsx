import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from './_components/forbidden'

export const Route = createFileRoute('/(errors)/403')({
  component: ForbiddenError,
})

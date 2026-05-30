import { createFileRoute } from '@tanstack/react-router'
import { UnauthorisedError } from './_components/unauthorized-error'

export const Route = createFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})

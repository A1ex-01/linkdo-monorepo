import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { createLogger } from '@/utils/logger'

const logger = createLogger('handle-server-error')

export function handleServerError(error: unknown) {
  logger.warn('Server error', error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'No content.'
  }

  if (error instanceof AxiosError) {
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    }
  }

  toast.error(errMsg)
}

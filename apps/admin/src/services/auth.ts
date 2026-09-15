import { request } from './client-request'
import type { IUser } from '@linkdo/shared'

export interface VerifyCodeResponse {
  token: string
  email: string
}

export const authService = {
  sendCode: (email: string) =>
    request<{ message: string }>({
      url: '/auth/email/send-code',
      method: 'post',
      data: { email },
    }),

  verifyCode: (email: string, code: string) =>
    request<VerifyCodeResponse>({
      url: '/auth/email/verify',
      method: 'post',
      data: { email, code },
    }),

  getMe: () => request<IUser>({ url: '/auth/me', method: 'get' }),
}

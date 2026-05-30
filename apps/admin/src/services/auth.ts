import { request } from './client-request'

export interface User {
  uuid: string
  notion_user_id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

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

  getMe: () => request<User>({ url: '/auth/me', method: 'get' }),
}

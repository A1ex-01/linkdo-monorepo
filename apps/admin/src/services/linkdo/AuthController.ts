/* eslint-disable */
import { request } from '@umijs/max';
import type { API } from './typings';

/** 发送验证码 POST /api/v1/auth/email/send-code */
export async function sendCode(
  body: { email: string },
  options?: { [key: string]: any },
) {
  return request<API.Result_string_>('/api/v1/auth/email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 验证码登录 POST /api/v1/auth/email/verify */
export async function loginByCode(
  body: { email: string; code: string },
  options?: { [key: string]: any },
) {
  return request<API.Result_LoginVO_>('/api/v1/auth/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前用户 GET /api/v1/auth/me */
export async function getMe(options?: { [key: string]: any }) {
  return request<API.Result_UserInfo_>('/api/v1/auth/me', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 登出 POST /api/v1/auth/logout */
export async function logout(options?: { [key: string]: any }) {
  return request<API.Result>('/api/v1/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

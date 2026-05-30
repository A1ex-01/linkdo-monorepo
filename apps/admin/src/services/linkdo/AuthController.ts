/* eslint-disable */
import { request } from '@umijs/max';

/** 发送验证码 POST /api/v1/auth/email/send-code */
export async function sendCode(
  body: { email: string },
  options?: { [key: string]: any },
) {
  return request('/api/v1/auth/email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 验证码登录 POST /api/v1/auth/email/verify */
export async function loginByCode(
  body: { email: string; code: string },
  options?: { [key: string]: any },
) {
  return request('/api/v1/auth/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 获取当前用户 GET /api/v1/auth/me */
export async function getMe(options?: { [key: string]: any }) {
  return request('/api/v1/auth/me', {
    method: 'GET',
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

/** 登出 POST /api/v1/auth/logout */
export async function logout(options?: { [key: string]: any }) {
  return request('/api/v1/auth/logout', {
    method: 'POST',
    baseURL: 'http://192.168.55.102:8080',
    ...(options || {}),
  });
}

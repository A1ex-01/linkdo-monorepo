// 运行时配置
import { TOKEN_KEY } from '@/constants';
import services from '@/services/linkdo';
import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message } from 'antd';

// 全局初始化数据配置
export async function getInitialState(): Promise<{
  name: string;
  currentUser: API.UserInfo | undefined;
}> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { name: 'Link-Do Admin', currentUser: undefined };
  }

  try {
    const res = await services.AuthController.getMe();
    if (res.success && res.data) {
      return { name: res.data.name || 'Admin', currentUser: res.data };
    }
    // token invalid
    localStorage.removeItem(TOKEN_KEY);
    return { name: 'Link-Do Admin', currentUser: undefined };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return { name: 'Link-Do Admin', currentUser: undefined };
  }
}

// ProLayout 配置
export const layout: ExposeModel<'initialState'>['settings'] = {
  logoutmentsOnLogin: false,
  title: 'Link-Do Admin',
  logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
  locale: false,
};

// Request 配置
export const request: RequestConfig = {
  baseURL: '/api',
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },

  requestInterceptors: [
    (config: any) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
  ],

  responseInterceptors: [
    (response: any) => {
      return response;
    },
  ],

  errorConfig: {
    errorHandler: (error: any) => {
      if (error.response) {
        const { status } = error.response;
        if (status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          message.error('登录已过期，请重新登录');
          history.push('/user/login');
        } else if (status === 403) {
          message.error('没有权限访问');
        } else if (status >= 500) {
          message.error('服务器错误，请稍后重试');
        } else {
          const msg = error.response.data?.error || '请求失败';
          message.error(msg);
        }
      } else {
        message.error('网络错误，请检查网络连接');
      }
      throw error;
    },
  },
};

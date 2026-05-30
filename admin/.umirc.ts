import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'Link-Do Admin',
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    locale: false,
  },
  routes: [
    {
      path: '/user',
      layout: false,
      routes: [
        {
          name: '登录',
          path: '/user/login',
          component: './Login',
        },
      ],
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      name: '首页',
      path: '/dashboard',
      component: './Dashboard',
    },
    {
      name: 'To-Do 列表',
      path: '/todos',
      component: './Todos',
    },
    {
      name: '用户管理',
      path: '/users',
      component: './Users',
    },
  ],
  npmClient: 'pnpm',
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
});

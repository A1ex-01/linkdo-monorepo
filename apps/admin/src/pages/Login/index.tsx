import { TOKEN_KEY } from '@/constants';
import services from '@/services/linkdo';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import {
  ProCard,
  ProForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { useNavigate } from '@umijs/max';
import { App, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendCode = async (email: string) => {
    if (!email) {
      message.error('请先输入邮箱');
      return;
    }
    setSending(true);
    try {
      const res = await services.AuthController.sendCode({ email });
      if (res.success) {
        message.success('验证码已发送到邮箱');
      }
    } finally {
      setSending(false);
    }
    return true;
  };

  const handleLogin = async (values: { email: string; code: string }) => {
    setLoading(true);
    try {
      const res = await services.AuthController.loginByCode({
        email: values.email,
        code: values.code,
      });
      if (res.success && res.data?.token) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        message.success('登录成功');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f0f',
      }}
    >
      <ProCard
        style={{
          width: 420,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        styles={{ body: { padding: '40px 36px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title
            level={2}
            style={{ color: '#e5e5e5', margin: 0, fontWeight: 700 }}
          >
            Link-Do Admin
          </Title>
          <Text style={{ color: '#8c8c8c', display: 'block', marginTop: 8 }}>
            管理员后台管理系统
          </Text>
        </div>

        <ProForm
          onFinish={handleLogin}
          submitter={{
            searchConfig: { submitText: '登录' },
            submitButtonProps: { loading, block: true, size: 'large' },
          }}
          layout="vertical"
        >
          <ProFormText
            name="email"
            label="邮箱"
            placeholder="请输入管理员邮箱"
            fieldProps={{
              prefix: <MailOutlined style={{ color: '#8c8c8c' }} />,
              size: 'large',
              style: { background: '#232323', color: '#e5e5e5' },
            }}
            rules={[
              { required: true, message: '请输入邮箱' },
              {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '请输入有效的邮箱地址',
              },
            ]}
          />

          <ProFormCaptcha
            name="code"
            label="验证码"
            placeholder="请输入 6 位验证码"
            fieldProps={{
              prefix: <LockOutlined style={{ color: '#8c8c8c' }} />,
              size: 'large',
              style: { background: '#232323', color: '#e5e5e5' },
            }}
            captchaProps={{ size: 'large', loading: sending }}
            countDown={60}
            phoneName="email"
            onGetCaptcha={async (email: string) => {
              return handleSendCode(email);
            }}
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为 6 位数字' },
            ]}
          />
        </ProForm>
      </ProCard>
    </div>
  );
};

export default LoginPage;

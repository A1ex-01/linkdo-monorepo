import services from '@/services/linkdo';
import type { API } from '@/services/linkdo/typings';
import { UserOutlined } from '@ant-design/icons';
import {
  ActionRef,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Avatar } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';

const UsersPage: React.FC = () => {
  const actionRef = useRef<ActionRef>();

  const columns: ProColumns<API.UserInfo>[] = [
    {
      title: '用户',
      dataIndex: 'name',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={record.avatar_url}
            icon={<UserOutlined />}
            style={{ background: '#1677ff', flexShrink: 0 }}
          />
          <div>
            <div style={{ color: '#e5e5e5', fontWeight: 500 }}>
              {record.name || '-'}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {record.email || '-'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Notion ID',
      dataIndex: 'notion_user_id',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
          {record.notion_user_id || '-'}
        </span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>{record.email || '-'}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.created_at
            ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm')
            : '-'}
        </span>
      ),
    },
    {
      title: '最近更新',
      dataIndex: 'updated_at',
      width: 160,
      hideInSearch: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.updated_at
            ? dayjs(record.updated_at).format('YYYY-MM-DD HH:mm')
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: '用户管理' }}>
      <ProTable<API.UserInfo>
        actionRef={actionRef}
        rowKey="uuid"
        headerTitle="用户列表"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolBarRender={() => []}
        request={async (params) => {
          const res = await services.AdminController.listUsers({
            keyword: params.keyword || undefined,
            current: params.current,
            pageSize: params.pageSize,
          });
          return {
            data: res.data?.list || [],
            success: res.success,
            total: res.data?.total || 0,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{ reload: true, density: false }}
      />
    </PageContainer>
  );
};

export default UsersPage;

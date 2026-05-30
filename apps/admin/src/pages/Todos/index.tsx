import services from '@/services/linkdo';
import {
  ActionRef,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';

const statusColor: Record<string, string> = {
  backlog: 'default',
  this_week: 'processing',
  today: 'warning',
  done: 'success',
};

const statusLabel: Record<string, string> = {
  backlog: 'Backlog',
  this_week: '本周',
  today: '今日',
  done: '已完成',
};

function formatDuration(minutes?: number): string {
  if (!minutes || minutes === 0) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const TodosPage: React.FC = () => {
  const actionRef = useRef<ActionRef>();

  const columns: ProColumns<API.TaskInfo>[] = [
    {
      title: '任务标题',
      dataIndex: 'title',
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ color: '#e5e5e5' }}>{record.title || '-'}</span>
      ),
    },
    {
      title: '所属 To-Do',
      dataIndex: 'collection_name',
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.collection_name || '-'}
        </span>
      ),
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      width: 140,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.user_name || record.user_email || '-'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={statusColor[record.status || 'backlog']}>
          {statusLabel[record.status || 'backlog']}
        </Tag>
      ),
    },
    {
      title: '预估时间',
      dataIndex: 'estimated_time',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {formatDuration(record.estimated_time)}
        </span>
      ),
    },
    {
      title: '实际时间',
      dataIndex: 'actual_time',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <span
          style={{
            color:
              (record.actual_time ?? 0) > (record.estimated_time ?? 0)
                ? '#ff4d4f'
                : '#8c8c8c',
          }}
        >
          {formatDuration(record.actual_time)}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.created_at
            ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm')
            : '-'}
        </span>
      ),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      width: 160,
      render: (_, record) => (
        <span style={{ color: '#8c8c8c' }}>
          {record.completed_at
            ? dayjs(record.completed_at).format('YYYY-MM-DD HH:mm')
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: 'To-Do 列表管理' }}>
      <ProTable<API.TaskInfo>
        actionRef={actionRef}
        rowKey="uuid"
        headerTitle="任务列表"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolBarRender={() => []}
        request={async (params) => {
          const res = await services.AdminController.listAdminTasks({
            status: params.status || undefined,
            user_uuid: params.user_uuid || undefined,
            start_date: params.start_date || undefined,
            end_date: params.end_date || undefined,
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

export default TodosPage;

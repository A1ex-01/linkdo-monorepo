import services from '@/services/linkdo';
import {
  CheckCircleOutlined,
  FolderOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<API.StatsInfo>({});

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await services.AdminController.getStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <PageContainer>
      <Title level={3} style={{ color: '#e5e5e5', marginBottom: 24 }}>
        数据概览
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={
                  <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                    用户总数
                  </Text>
                }
                value={stats.total_users ?? 0}
                prefix={
                  <UserOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                }
                valueStyle={{ color: '#e5e5e5', fontSize: 32, fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={
                  <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                    To-Do 列表数
                  </Text>
                }
                value={stats.total_todos ?? 0}
                prefix={
                  <FolderOutlined
                    style={{ color: '#52c41a', marginRight: 8 }}
                  />
                }
                valueStyle={{ color: '#e5e5e5', fontSize: 32, fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={
                  <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                    任务总数
                  </Text>
                }
                value={stats.total_tasks ?? 0}
                prefix={
                  <UnorderedListOutlined
                    style={{ color: '#faad14', marginRight: 8 }}
                  />
                }
                valueStyle={{ color: '#e5e5e5', fontSize: 32, fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            {loading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={
                  <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                    今日完成
                  </Text>
                }
                value={stats.today_done ?? 0}
                prefix={
                  <CheckCircleOutlined
                    style={{ color: '#13c2c2', marginRight: 8 }}
                  />
                }
                valueStyle={{ color: '#e5e5e5', fontSize: 32, fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          marginTop: 24,
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Title level={4} style={{ color: '#e5e5e5' }}>
          欢迎使用 Link-Do Admin
        </Title>
        <Text style={{ color: '#8c8c8c' }}>
          通过左侧菜单可以管理 To-Do 列表和用户数据。
        </Text>
      </Card>
    </PageContainer>
  );
};

export default DashboardPage;

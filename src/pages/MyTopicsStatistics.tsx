import { useEffect, useState } from 'react';
import { Card, Steps, Tag, Typography, Alert, Space, message, Empty } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getMyStatistics } from '../services/statistics/StatisticsService';
import type { OwnerStatisticsResponse, TopicStatus } from '../services/statistics/StatisticsService';

const { Title, Text } = Typography;

const STATUS_LABEL: Record<TopicStatus, { text: string; color: string }> = {
  in_progress: { text: 'Đang thực hiện', color: 'blue' },
  completed: { text: 'Hoàn thành', color: 'green' },
  overdue: { text: 'Trễ hạn', color: 'red' },
};

const MILESTONE_STEP_STATUS: Record<string, 'finish' | 'process' | 'wait'> = {
  completed: 'finish',
  in_progress: 'process',
  upcoming: 'wait',
  not_started: 'wait',
};

export default function MyTopicsStatistics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OwnerStatisticsResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getMyStatistics();
      setData(res);
    } catch (err) {
      message.error('Không tải được dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        Đề tài của tôi
      </Title>
      <Text type="secondary">Tiến độ và mốc thời gian các đề tài bạn đang chủ trì</Text>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Text strong style={{ fontSize: 13 }}>
          Việc cần làm
        </Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size={8}>
          {loading && <Card loading />}
          {!loading && (data?.todoItems.length ?? 0) === 0 && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              Không có việc cần xử lý gấp.
            </Text>
          )}
          {data?.todoItems.map((item) => (
            <Alert
              key={item.id}
              type={item.level === 'overdue' ? 'error' : 'warning'}
              showIcon
              icon={
                item.level === 'overdue' ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />
              }
              message={item.content}
              description={
                item.level === 'overdue' ? `Quá hạn ${item.days} ngày` : `Còn ${item.days} ngày`
              }
            />
          ))}
        </Space>
      </div>

      <Text strong style={{ fontSize: 13 }}>
        Đề tài của tôi ({data?.myTopics.length ?? 0})
      </Text>

      <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size={16}>
        {loading && <Card loading />}
        {!loading && (data?.myTopics.length ?? 0) === 0 && (
          <Empty description="Bạn chưa chủ trì đề tài nào" />
        )}

        {data?.myTopics.map((topic) => (
          <Card key={topic.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text strong>{topic.topicName}</Text>
              <Tag color={STATUS_LABEL[topic.status].color}>{STATUS_LABEL[topic.status].text}</Tag>
            </div>

            <Steps
              size="small"
              items={topic.milestones.map((m) => ({
                title: m.name,
                status: MILESTONE_STEP_STATUS[m.status],
              }))}
            />

            {topic.nextDeadline && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid #f0f0f0',
                  textAlign: 'right',
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hạn tiếp theo: {new Date(topic.nextDeadline).toLocaleDateString('vi-VN')}
                </Text>
              </div>
            )}
          </Card>
        ))}
      </Space>
    </div>
  );
}

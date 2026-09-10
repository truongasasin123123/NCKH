import { useEffect, useState } from 'react';
import { Card, Steps, Tag, Typography, Alert, Space, message, Empty, Row, Col, Statistic, Button, Dropdown, Table } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined, DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import { exportMyTopicsReport, getMyStatistics } from '../services/statistics/StatisticsService';
import type { ExportFormat, OwnerStatisticsResponse, TopicStatus } from '../services/statistics/StatisticsService';
import type { ColumnsType } from 'antd/es/table';

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
  const [exporting, setExporting] = useState(false);

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

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      await exportMyTopicsReport(format);
      message.success('Đã xuất báo cáo đề tài của bạn');
    } catch {
      message.error('Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  }

  const topics = data?.myTopics ?? [];
  const overview = {
    total: topics.length,
    inProgress: topics.filter((topic) => topic.status === 'in_progress').length,
    completed: topics.filter((topic) => topic.status === 'completed').length,
    overdue: topics.filter((topic) => topic.status === 'overdue').length,
  };


  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }} wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>Thống kê đề tài của tôi</Title>
          <Text type="secondary">Tổng quan tiến độ và mốc thời gian các đề tài bạn tham gia hoặc hướng dẫn</Text>
        </div>
        <Dropdown menu={{
          items: [
            { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
            { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
            { key: 'docx', label: 'Word (.docx)', icon: <FileWordOutlined /> },
          ], onClick: ({ key }) => handleExport(key as ExportFormat)
        }} disabled={exporting}>
          <Button type="primary" icon={<DownloadOutlined />} loading={exporting}>Xuất báo cáo</Button>
        </Dropdown>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Tổng đề tài" value={overview.total} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Đang thực hiện" value={overview.inProgress} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Hoàn thành" value={overview.completed} valueStyle={{ color: '#389e0d' }} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Trễ hạn" value={overview.overdue} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>

      <Card title="Việc cần làm" loading={loading} style={{ marginBottom: 20 }}>
        {!loading && (data?.todoItems.length ?? 0) === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có việc cần xử lý gấp" />}
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
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
      </Card>

      <Card
        title={`Đề tài của tôi (${overview.total})`}
        loading={loading}
        extra={
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
            loading={exporting}
          >
            Xuất Excel
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={topics}
          locale={{ emptyText: <Empty description="Bạn chưa chủ trì đề tài nào" /> }}
          pagination={{ pageSize: 5, hideOnSinglePage: true }}
          columns={
            [
              {
                title: 'Tên đề tài',
                dataIndex: 'topicName',
                render: (value: string) => <Text strong>{value}</Text>,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                width: 150,
                filters: [
                  { text: 'Đang thực hiện', value: 'in_progress' },
                  { text: 'Hoàn thành', value: 'completed' },
                  { text: 'Trễ hạn', value: 'overdue' },
                ],
                onFilter: (value, record) => record.status === value,
                render: (status: TopicStatus) => (
                  <Tag color={STATUS_LABEL[status].color}>{STATUS_LABEL[status].text}</Tag>
                ),
              },
              {
                title: 'Tiến độ mốc',
                dataIndex: 'milestones',
                width: 150,
                render: (milestones: OwnerStatisticsResponse['myTopics'][number]['milestones']) => {
                  const done = milestones.filter((m) => m.status === 'completed').length;
                  return <Text type="secondary">{done}/{milestones.length} mốc hoàn thành</Text>;
                },
              },
              {
                title: 'Hạn tiếp theo',
                dataIndex: 'nextDeadline',
                width: 150,
                align: 'right',
                render: (value?: string) =>
                  value ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(value).toLocaleDateString('vi-VN')}
                    </Text>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                  ),
              },
            ] as ColumnsType<OwnerStatisticsResponse['myTopics'][number]>
          }
          expandable={{
            expandedRowRender: (topic) => (
              <Steps
                size="small"
                items={topic.milestones.map((m) => ({
                  title: m.name,
                  status: MILESTONE_STEP_STATUS[m.status],
                }))}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}

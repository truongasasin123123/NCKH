import { useEffect, useState } from 'react';
import { Card, Tag, Typography, Space, message, Empty, Row, Col, Statistic, Button, Dropdown, Table, Grid, Descriptions } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import { exportCouncilTopicsReport, getCouncilStatistics } from '../services/statistics/StatisticsService';
import type { CouncilStatisticsResponse, CouncilTopic, CouncilTopicStatus, ExportFormat } from '../services/statistics/StatisticsService';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const STATUS_LABEL: Record<CouncilTopicStatus, { text: string; color: string }> = {
  pending: { text: 'Chờ phê duyệt', color: 'blue' },
  approved: { text: 'Đã phê duyệt', color: 'green' },
  rejected: { text: 'Từ chối', color: 'red' },
};

export default function CouncilStatistics() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<CouncilStatisticsResponse | null>(null);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getCouncilStatistics();
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
      await exportCouncilTopicsReport(format);
      message.success('Đã xuất báo cáo đề tài của hội đồng');
    } catch {
      message.error('Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  }

  const topics = data?.topics ?? [];
  const overview = data?.overview ?? { totalTopics: 0, pending: 0, approved: 0 };

  const desktopColumns: ColumnsType<CouncilTopic> = [
    {
      title: 'Tên đề tài',
      dataIndex: 'topicName',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Loại hội đồng',
      dataIndex: 'councilTypeName',
      width: 180,
      render: (value: string) => <Tag color="purple">{value}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      filters: [
        { text: 'Chờ phê duyệt', value: 'pending' },
        { text: 'Đã phê duyệt', value: 'approved' },
        { text: 'Từ chối', value: 'rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: CouncilTopicStatus) => (
        <Tag color={STATUS_LABEL[status].color}>{STATUS_LABEL[status].text}</Tag>
      ),
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'submittedDate',
      width: 130,
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Ngày xử lý',
      dataIndex: 'processedDate',
      width: 130,
      align: 'right',
      render: (value: string | null) =>
        value ? (
          <Text type="secondary" style={{ fontSize: 12 }}>{new Date(value).toLocaleDateString('vi-VN')}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
  ];

  const mobileColumns: ColumnsType<CouncilTopic> = [
    {
      title: 'Đề tài',
      key: 'topic',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1677ff', lineHeight: 1.4 }}>{record.topicName}</div>
          <div style={{ fontSize: 12, color: '#722ed1', marginTop: 2 }}>{record.councilTypeName}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 125,
      align: 'right',
      render: (status: CouncilTopicStatus) => (
        <Tag color={STATUS_LABEL[status].color} style={{ margin: 0 }}>
          {STATUS_LABEL[status].text}
        </Tag>
      ),
    },
  ];

  const renderExpandedContent = (record: CouncilTopic) => (
    <div style={{ padding: '4px 0' }}>
      <Descriptions size="small" column={1} bordered={false}>
        <Descriptions.Item label="Ngày gửi">
          {new Date(record.submittedDate).toLocaleDateString('vi-VN')}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày xử lý">
          {record.processedDate ? new Date(record.processedDate).toLocaleDateString('vi-VN') : 'Chưa xử lý'}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}
        direction={isMobile ? 'vertical' : 'horizontal'}
        wrap
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>Thống kê đề tài của hội đồng</Title>
          <Text type="secondary">Tổng quan các đề tài thuộc phạm vi xử lý của hội đồng</Text>
        </div>
        <Dropdown menu={{
          items: [
            { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
            { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
            { key: 'docx', label: 'Word (.docx)', icon: <FileWordOutlined /> },
          ], onClick: ({ key }) => handleExport(key as ExportFormat)
        }} disabled={exporting}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            style={{ width: isMobile ? '100%' : 'auto' }}
          >
            Xuất báo cáo
          </Button>
        </Dropdown>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={8}>
          <Card loading={loading}><Statistic title="Tổng đề tài" value={overview.totalTopics} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic title="Chờ phê duyệt" value={overview.pending} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card loading={loading}>
            <Statistic title="Đã phê duyệt" value={overview.approved} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={`Đề tài của hội đồng (${overview.totalTopics})`}
        loading={loading}
        extra={
          <Button icon={<FileExcelOutlined />} onClick={() => handleExport('excel')} loading={exporting}>
            Xuất Excel
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={topics}
          locale={{ emptyText: <Empty description="Chưa có đề tài nào thuộc hội đồng" /> }}
          pagination={{ pageSize: 5, hideOnSinglePage: true, simple: isMobile }}
          size={isMobile ? 'small' : 'middle'}
          columns={isMobile ? mobileColumns : desktopColumns}
          scroll={isMobile ? undefined : { x: 750 }}
          expandable={
            isMobile
              ? {
                  expandedRowRender: renderExpandedContent,
                  expandRowByClick: true,
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
}
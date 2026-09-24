import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Steps,
  Tag,
  Typography,
  Space,
  message,
  Empty,
  Row,
  Col,
  Statistic,
  Button,
  Dropdown,
  Table,
  List,
  Badge,
} from 'antd';
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  MinusCircleOutlined,
  FileTextOutlined,
  CheckCircleTwoTone,
  ArrowRightOutlined,
  UploadOutlined,
  CalendarOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
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

// Nhãn mô tả hiển thị bên dưới tiêu đề mỗi mốc
const MILESTONE_STATUS_DESC: Record<string, { text: string; color: string }> = {
  completed: { text: 'Hoàn thành', color: '#389e0d' },
  in_progress: { text: 'Chờ nghiệm thu', color: '#d48806' },
  upcoming: { text: 'Chưa tới hạn', color: '#8c8c8c' },
  not_started: { text: 'Chưa bắt đầu', color: '#8c8c8c' },
};

// Tag trạng thái báo cáo dựa theo trạng thái mốc hiện tại
const REPORT_TAG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Đã duyệt', color: 'success' },
  in_progress: { label: 'Nháp', color: 'default' },
  upcoming: { label: 'Chưa có', color: 'default' },
  not_started: { label: 'Chưa có', color: 'default' },
};

// Icon tương ứng cho từng bước của Steps
const STEP_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  in_progress: <ClockCircleFilled style={{ color: '#faad14' }} />,
  upcoming: <MinusCircleOutlined style={{ color: '#d9d9d9' }} />,
  not_started: <MinusCircleOutlined style={{ color: '#d9d9d9' }} />,
};

type Topic = OwnerStatisticsResponse['myTopics'][number];

function getActionMilestone(milestones: Topic['milestones']) {
  return milestones.find((milestone) => milestone.status === 'in_progress')
    ?? milestones.find((milestone) => milestone.status !== 'completed');
}

function getDeadlineLabel(deadline?: string) {
  if (!deadline) return { text: 'Chưa có hạn', color: 'default' as const };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(deadline);
  dueDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { text: `Quá hạn ${Math.abs(days)} ngày`, color: 'error' as const };
  if (days === 0) return { text: 'Đến hạn hôm nay', color: 'warning' as const };
  return { text: `Còn ${days} ngày`, color: days <= 3 ? 'warning' as const : 'blue' as const };
}

export default function MyTopicsStatistics() {
  const navigate = useNavigate();
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
    inProgress: topics.filter((t) => t.status === 'in_progress').length,
    completed: topics.filter((t) => t.status === 'completed').length,
    overdue: topics.filter((t) => t.status === 'overdue').length,
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }} wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>Thống kê đề tài của tôi</Title>
          <Text type="secondary">Tổng quan tiến độ và mốc thời gian các đề tài bạn tham gia hoặc hướng dẫn</Text>
        </div>
        <Dropdown
          menu={{
            items: [
              { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
              { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
              { key: 'docx', label: 'Word (.docx)', icon: <FileWordOutlined /> },
            ],
            onClick: ({ key }) => handleExport(key as ExportFormat),
          }}
          disabled={exporting}
        >
          <Button type="primary" icon={<DownloadOutlined />} loading={exporting}>Xuất báo cáo</Button>
        </Dropdown>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Tổng đề tài" value={overview.total} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Đang thực hiện" value={overview.inProgress} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Hoàn thành" value={overview.completed} valueStyle={{ color: '#389e0d' }} /></Card></Col>
        <Col xs={12} md={6}><Card loading={loading}><Statistic title="Trễ hạn" value={overview.overdue} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>

      <Card
        title={
          <Space>
            <span>Việc cần làm</span>
            {data?.todoItems?.length ? (
              <Badge count={data.todoItems.length} overflowCount={99} />
            ) : null}
          </Space>
        }
        loading={loading}
        style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        {!loading && (data?.todoItems.length ?? 0) === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 44, marginBottom: 12 }} />
            <Title level={5} style={{ margin: '0 0 6px 0', color: '#262626' }}>
              Tuyệt vời! Không có việc nào cần xử lý gấp
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Tất cả các mốc nghiên cứu và báo cáo đề tài của bạn đều đang đúng tiến độ.
            </Text>
            <Button
              type="primary"
              ghost
              icon={<FolderOpenOutlined />}
              onClick={() => navigate('/mainhome')}
            >
              Xem danh sách đề tài của tôi
            </Button>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={data?.todoItems}
            renderItem={(item) => {
              const isOverdue = item.level === 'overdue';
              return (
                <List.Item
                  key={item.id}
                  style={{
                    padding: '14px 16px',
                    marginBottom: 10,
                    borderRadius: 8,
                    border: isOverdue ? '1px solid #ffa39e' : '1px solid #ffe58f',
                    backgroundColor: isOverdue ? '#fff1f0' : '#fffbe6',
                  }}
                  actions={[
                    <Button
                      type="primary"
                      danger={isOverdue}
                      icon={isOverdue ? <UploadOutlined /> : <ArrowRightOutlined />}
                      onClick={() => navigate(`/mainhome/progress/${item.id}`)}
                    >
                      {isOverdue ? 'Xử lý ngay' : 'Cập nhật tiến độ'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      isOverdue ? (
                        <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f', marginTop: 4 }} />
                      ) : (
                        <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14', marginTop: 4 }} />
                      )
                    }
                    title={
                      <Space wrap>
                        <Tag color={isOverdue ? 'error' : 'warning'}>
                          {isOverdue ? `Quá hạn ${item.days} ngày` : `Còn ${item.days} ngày`}
                        </Tag>
                        <Text
                          strong
                          style={{ fontSize: 14, cursor: 'pointer' }}
                          onClick={() => navigate(`/mainhome/topic/${item.id}`)}
                        >
                          {item.content}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space style={{ marginTop: 4, color: '#595959', fontSize: 12 }}>
                        <span>
                          <CalendarOutlined /> Mã đề tài: <b>{item.id}</b>
                        </span>
                        <span>•</span>
                        <span>Nhấn nút bên phải để nộp báo cáo hoặc cập nhật trạng thái mốc</span>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Card
        title={`Đề tài của tôi (${overview.total})`}
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
                title: 'Mốc cần xử lý',
                dataIndex: 'nextDeadline',
                width: 230,
                render: (_: string | null, topic) => {
                  const milestone = getActionMilestone(topic.milestones);
                  if (!milestone) return <Tag color="success">Đã hoàn thành các mốc</Tag>;
                  const deadline = getDeadlineLabel(milestone.deadline);
                  return (
                    <Space direction="vertical" size={2}>
                      <Text strong ellipsis style={{ maxWidth: 190 }}>{milestone.name}</Text>
                      <Tag color={deadline.color} style={{ width: 'fit-content', margin: 0 }}>
                        {deadline.text}
                      </Tag>
                    </Space>
                  );
                },
              },
            ] as ColumnsType<OwnerStatisticsResponse['myTopics'][number]>
          }
          expandable={{
            expandedRowRender: (topic) => <TopicExpandedRow topic={topic} />,
          }}
        />
      </Card>
    </div>
  );
}

// ---- Expanded row: Steps timeline + card báo cáo mốc hiện tại ----
function TopicExpandedRow({ topic }: { topic: Topic }) {
  const activeMilestone = getActionMilestone(topic.milestones) ?? topic.milestones[topic.milestones.length - 1];

  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: '#fafbfc',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        margin: '4px 0',
      }}
    >
      {/* 1. Timeline các mốc tiến độ */}
      <div style={{ marginBottom: 18, padding: '4px 8px' }}>
        <Steps
          size="small"
          labelPlacement="vertical"
          items={topic.milestones.map((m) => ({
            title: <span style={{ fontWeight: 500 }}>{m.name}</span>,
            icon: STEP_ICONS[m.status],
            status: MILESTONE_STEP_STATUS[m.status],
            description: (
              <span
                style={{
                  fontSize: 12,
                  color: MILESTONE_STATUS_DESC[m.status]?.color ?? '#8c8c8c',
                  fontWeight: m.status === 'in_progress' ? 600 : 400,
                }}
              >
                {MILESTONE_STATUS_DESC[m.status]?.text ?? m.status}
              </span>
            ),
          }))}
        />
      </div>

      {/* 2. Thẻ hiển thị trạng thái báo cáo */}
      {activeMilestone ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #e6ebf1',
            borderRadius: 8,
            padding: '12px 18px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <Space size={12} align="center">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                backgroundColor: '#f0f5ff',
                color: '#2f54eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              <FileTextOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 13, marginRight: 8, color: '#1f1f1f' }}>
                Báo cáo {activeMilestone.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Nghiệm thu từng phần
              </Text>
            </div>
          </Space>

          <Tag
            color={REPORT_TAG[activeMilestone.status]?.color ?? 'default'}
            style={{
              margin: 0,
              padding: '2px 10px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {REPORT_TAG[activeMilestone.status]?.label ?? 'Nháp'}
          </Tag>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ fontSize: 12 }}>Đề tài chưa có mốc nào</span>}
        />
      )}
    </div>
  );
}

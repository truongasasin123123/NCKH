import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  Button,
  Dropdown,
  Table,
  Progress,
  Typography,
  Space,
  message,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/plots'; // npm install @ant-design/plots
import { getAdminOverview, exportReport } from '../services/statistics/StatisticsService';
import type {
  AdminStatisticsResponse,
  StatisticsQueryParams,
  ExportFormat,
} from '../services/statistics/StatisticsService';

const { Title, Text } = Typography;

export default function StatisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AdminStatisticsResponse | null>(null);
  const [filters, setFilters] = useState<StatisticsQueryParams>({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getAdminOverview(filters);
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
      await exportReport(format, filters);
      message.success('Đã xuất báo cáo');
    } catch (err) {
      message.error('Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  }

  const exportMenuItems = [
    { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
    { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
    { key: 'docx', label: 'Word (.docx)', icon: <FileWordOutlined /> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }} wrap>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Thống kê đề tài nghiên cứu
          </Title>
          <Text type="secondary">Tổng quan tiến độ và mốc thời gian toàn hệ thống</Text>
        </div>

        <Space wrap>
          <Select
            style={{ width: 150 }}
            allowClear
            placeholder="Tất cả năm học"
            value={filters.academicYear}
            onChange={(v) => setFilters((f) => ({ ...f, academicYear: v }))}
            options={[
              { value: '2025-2026', label: 'Năm học 2025-2026' },
              { value: '2026-2027', label: 'Năm học 2026-2027' },
              { value: '2024-2025', label: 'Năm học 2024-2025' },
            ]}
          />
          <Select
            style={{ width: 150 }}
            allowClear
            placeholder="Tất cả khoa"
            value={filters.departmentId}
            onChange={(v) => setFilters((f) => ({ ...f, departmentId: v }))}
            options={[
              // TODO: thay bằng danh sách khoa lấy từ API thực tế
              { value: 'cntt', label: 'Khoa CNTT' },
              { value: 'nong-hoc', label: 'Khoa Nông học' },
              { value: 'co-dien', label: 'Khoa Cơ điện' },
            ]}
          />
          <Dropdown
            menu={{
              items: exportMenuItems,
              onClick: ({ key }) => handleExport(key as ExportFormat),
            }}
            disabled={exporting}
          >
            <Button type="primary" icon={<DownloadOutlined />} loading={exporting}>
              Xuất báo cáo
            </Button>
          </Dropdown>
        </Space>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic title="Tổng đề tài" value={data?.overview.totalTopics ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Đang thực hiện"
              value={data?.overview.inProgress ?? 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Hoàn thành"
              value={data?.overview.completed ?? 0}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Trễ hạn"
              value={data?.overview.overdue ?? 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={24}>
          <Card title="Đề tài đăng ký theo tháng" loading={loading}>
            {data && (
              <Column
                data={data.monthlyTrend}
                xField="month"
                yField="count"
                height={200}
                columnStyle={{ radius: [4, 4, 0, 0] }}
                color="#378ADD"
              />
            )}
          </Card>
        </Col>
        
      </Row>

      {data && data.overdueTopics.length > 0 && (
        <Card
          title={
            <span style={{ color: '#cf1322' }}>
              <WarningOutlined /> Cảnh báo trễ hạn ({data.overdueTopics.length})
            </span>
          }
          style={{ marginBottom: 20, borderColor: '#ffccc7' }}
        >
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={data.overdueTopics}
            columns={[
              { title: 'Đề tài', dataIndex: 'topicName' },
              { title: 'Chủ nhiệm', dataIndex: 'owner', width: 180 },
              {
                title: 'Số ngày trễ',
                dataIndex: 'daysOverdue',
                width: 120,
                align: 'right',
                render: (v) => <Text type="danger">{v} ngày</Text>,
              },
            ]}
          />
        </Card>
      )}

      <Card title="Đề tài theo khoa" loading={loading}>
        {data?.byDepartment.map((d) => {
          const max = Math.max(...data.byDepartment.map((x) => x.count), 1);
          return (
            <div key={d.departmentName} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <Text type="secondary">{d.departmentName}</Text>
                <Text type="secondary">{d.count}</Text>
              </div>
              <Progress
                percent={Math.round((d.count / max) * 100)}
                showInfo={false}
                strokeColor="#378ADD"
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
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
import { Column, Pie } from '@ant-design/plots';
import { getAdminOverview, exportReport } from '../services/statistics/StatisticsService';
import type {
  AdminStatisticsResponse,
  StatisticsQueryParams,
  ExportFormat,
} from '../services/statistics/StatisticsService';

const { Title, Text } = Typography;

function parseMonthLabel(label: string): number {
  // Tạo khóa YYYYMM từ nhãn dạng "tháng 08, 2026" để tách tháng/năm ổn định.
  const match = label.match(/(\d{1,2}).*?(\d{4})/);
  if (!match) return 0;
  const [, month, year] = match;
  return Number(year) * 100 + Number(month);
}

export default function StatisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AdminStatisticsResponse | null>(null);
  const [filters, setFilters] = useState<StatisticsQueryParams>({});
  const [chartYear, setChartYear] = useState<number>();

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

  const CHART_COLORS = {
    primary: '#1677ff',
    success: '#5AD8A6',
    danger: '#FF9845',
  };

  const chartYears = useMemo(() => {
    const years = [...new Set((data?.monthlyTrend || [])
      .map((item) => Math.floor(parseMonthLabel(item.month) / 100))
      .filter((year) => year > 0))]
      .sort((a, b) => b - a);
    return years.length ? years : [new Date().getFullYear()];
  }, [data?.monthlyTrend]);

  const selectedChartYear = chartYear ?? chartYears[0];

  const monthlyChartData = useMemo(() => {
    const trends = data?.monthlyTrend || [];
    const countByMonth = new Map(
      trends
        .filter((item) => Math.floor(parseMonthLabel(item.month) / 100) === selectedChartYear)
        .map((item) => [parseMonthLabel(item.month) % 100, item.count]),
    );

    return Array.from({ length: 12 }, (_, index) => ({
      month: `T${String(index + 1).padStart(2, '0')}`,
      monthFull: `Tháng ${String(index + 1).padStart(2, '0')}`,
      count: countByMonth.get(index + 1) || 0,
    }));
  }, [data?.monthlyTrend, selectedChartYear]);

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
        <Col xs={24} md={14}>
          <Card
            title="Đề tài đăng ký theo tháng"
            loading={loading}
            styles={{ body: { padding: '18px 22px 12px' } }}
            extra={
              <Select
                value={selectedChartYear}
                onChange={setChartYear}
                style={{ width: 120 }}
                options={chartYears.map((year) => ({ value: year, label: `Năm ${year}` }))}
              />
            }
          >
            {data && (
              <Column
                data={monthlyChartData.filter((item) => item.count > 0)}
                xField="month"
                yField="count"
                height={320}
                scale={{
                  x: { domain: monthlyChartData.map((item) => item.month) },
                  y: { domainMin: 0 },
                }}
                style={{
                  radius: 8,
                  fill: CHART_COLORS.primary,
                }}
                maxColumnWidth={44}
                label={{
                  position: 'top',
                  offsetY: -6,
                  style: {
                    fill: '#595959',
                    fontSize: 13,
                    fontWeight: 600,
                  },
                }}
                axis={{
                  x: {
                    labelFill: '#8c8c8c',
                    labelFontSize: 11,
                    labelAutoRotate: false,
                    line: false,
                    tick: false,
                  },
                  y: {
                    labelFill: '#8c8c8c',
                    labelFontSize: 12,
                    line: false,
                    tick: false,
                    gridStroke: '#f0f0f0',
                    gridLineDash: [4, 4],
                  },
                }}
                tooltip={{
                  title: 'monthFull',
                  items: [
                    {
                      field: 'count',
                      name: 'Số đề tài đăng ký',
                      valueFormatter: (value: number) => `${value} đề tài`,
                    },
                  ],
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Tỷ lệ trạng thái đề tài" loading={loading}>
            {data && (
              <Pie
                data={[
                  { type: 'Đang thực hiện', value: data.overview.inProgress },
                  { type: 'Hoàn thành', value: data.overview.completed },
                  { type: 'Trễ hạn', value: data.overview.overdue },
                ]}
                angleField="value"
                colorField="type"
                height={320}
                radius={0.8}
                innerRadius={0.6}
                color={[CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.danger]}
                label={{
                  type: 'inner',
                  offset: '-30%',
                  content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,
                  style: { fill: '#fff', fontSize: 12, textAlign: 'center' },
                }}
                statistic={{
                  title: false,
                  content: {
                    style: { fontSize: 20, fontWeight: 600, color: '#262626' },
                    content: `${data.overview.totalTopics}`,
                  },
                }}
                legend={{ position: 'bottom' }}
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

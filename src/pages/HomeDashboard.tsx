import { useEffect, useState } from 'react';
import { Button, Card, Col, Dropdown, Progress, Row, Space, Spin, Typography, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import { exportReport, getAdminOverview } from '../services/statistics/StatisticsService';
import type { AdminStatisticsResponse, ExportFormat } from '../services/statistics/StatisticsService';

const { Text } = Typography;

const statisticCards = [
  { key: 'totalTopics', label: 'Tổng đề tài', background: '#f7f9f7', color: '#1a2b1f' },
  { key: 'inProgress', label: 'Đang thực hiện', background: '#fdf3e2', color: '#633806' },
  { key: 'completed', label: 'Hoàn thành', background: '#e5f3ea', color: '#173404' },
  { key: 'overdue', label: 'Trễ hạn', background: '#fdecec', color: '#501313' },
] as const;

export default function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AdminStatisticsResponse | null>(null);

  useEffect(() => {
    getAdminOverview({})
      .then(setData)
      .catch(() => message.error('Không tải được dữ liệu thống kê'))
      .finally(() => setLoading(false));
  }, []);

  const trendMax = Math.max(...(data?.monthlyTrend.map((item) => item.count) || []), 1);
  const departmentMax = Math.max(...(data?.byDepartment.map((item) => item.count) || []), 1);
  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await exportReport(format, {});
      message.success('Đã xuất báo cáo');
    } catch {
      message.error('Xuất báo cáo thất bại');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <div>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
          <div>
            <Text strong style={{ display: 'block', fontSize: 15, color: '#2c3b30', marginBottom: 2 }}>Thống kê đề tài nghiên cứu</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Tổng quan tiến độ và mốc thời gian toàn hệ thống</Text>
          </div>
          <Dropdown menu={{ items: [
            { key: 'excel', label: 'Excel (.xlsx)', icon: <FileExcelOutlined /> },
            { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
            { key: 'docx', label: 'Word (.docx)', icon: <FileWordOutlined /> },
          ], onClick: ({ key }) => void handleExport(key as ExportFormat) }} disabled={exporting}>
            <Button type="primary" size="small" icon={<DownloadOutlined />} loading={exporting}>Xuất báo cáo</Button>
          </Dropdown>
        </Space>
        <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
          {statisticCards.map(({ key, label, background, color }) => (
            <Col xs={12} md={6} key={key}>
              <Card styles={{ body: { padding: 12 } }} style={{ border: 0, background, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, color }}>{label}</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color, marginTop: 2 }}>{data?.overview[key] ?? 0}</div>
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[10, 10]}>
          <Col xs={24} md={14}>
            <Card styles={{ body: { padding: 12 } }} style={{ borderColor: '#e5e9e6', borderRadius: 10, height: '100%' }}>
              <Text strong style={{ fontSize: 11, color: '#2c3b30' }}>Đề tài đăng ký theo tháng</Text>
              <div style={{ height: 64, display: 'flex', alignItems: 'end', gap: 8, paddingTop: 8 }}>
                {data?.monthlyTrend.length ? data.monthlyTrend.map((item) => <div key={item.month} title={`${item.month}: ${item.count}`} style={{ flex: 1, minWidth: 10, height: `${Math.max(12, (item.count / trendMax) * 100)}%`, borderRadius: '3px 3px 0 0', background: '#639922' }} />) : <Text type="secondary" style={{ fontSize: 12 }}>Chưa có dữ liệu</Text>}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <Card styles={{ body: { padding: 12 } }} style={{ borderColor: '#e5e9e6', borderRadius: 10, height: '100%' }}>
              <Text strong style={{ fontSize: 11, color: '#2c3b30' }}>Đề tài theo khoa</Text>
              <div style={{ marginTop: 9, display: 'grid', gap: 6 }}>
                {data?.byDepartment.length ? data.byDepartment.slice(0, 4).map((item) => <div key={item.departmentName}><Text ellipsis style={{ display: 'block', fontSize: 10, color: '#6b7d70' }}>{item.departmentName} · {item.count}</Text><Progress percent={Math.round((item.count / departmentMax) * 100)} showInfo={false} strokeColor="#2d9e5f" trailColor="#eef1ee" size="small" /></div>) : <Text type="secondary" style={{ fontSize: 12 }}>Chưa có dữ liệu</Text>}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}

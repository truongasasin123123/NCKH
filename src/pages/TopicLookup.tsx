import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Select, Tag, Progress, Typography, Space, Button, message } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { searchTopics } from '../services/topic/TopicService';
import type { TopicLoad, TopicSearchQuery } from '../services/topic/TopicService';

const { Title, Text } = Typography;

const STATUS_TAG: Record<string, { text: string; color: string }> = {
  // TODO: khớp lại đúng giá trị TrangThai thật trong DB của bạn (đang đoán theo dữ liệu đã thấy trước đó)
  'Bắt đầu': { text: 'Bắt đầu', color: 'default' },
  'Chờ phê duyệt': { text: 'Chờ phê duyệt', color: 'blue' },
  'Đang thực hiện': { text: 'Đang thực hiện', color: 'processing' },
  'Chờ nghiệm thu': { text: 'Chờ nghiệm thu', color: 'orange' },
  'Đang nghiệm thu': { text: 'Đang nghiệm thu', color: 'cyan' },
  'Hoàn thành': { text: 'Hoàn thành', color: 'green' },
};

export default function TopicLookup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TopicLoad[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<TopicSearchQuery>({ page: 1, limit: 10 });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await searchTopics(filters);
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Không tải được danh sách đề tài');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setFilters((f) => ({ ...f, keyword: keywordInput.trim() || undefined, page: 1 }));
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={4} style={{ marginBottom: 4 }}>
        Tra cứu đề tài
      </Title>
      <Text type="secondary">Tìm kiếm và xem thông tin đề tài trong toàn hệ thống</Text>

      <Space style={{ margin: '20px 0' }} wrap>
        <Input
          placeholder="Tìm theo mã hoặc tên đề tài..."
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 260 }}
          allowClear
        />
        <Button icon={<SearchOutlined />} onClick={handleSearch}>
          Tìm kiếm
        </Button>
        <Select
          style={{ width: 160 }}
          allowClear
          placeholder="Phân loại"
          value={filters.phanLoai}
          onChange={(v) => setFilters((f) => ({ ...f, phanLoai: v, page: 1 }))}
          options={[
            { value: 'NCKH', label: 'NCKH' },
            // TODO: bổ sung các phân loại khác nếu có
          ]}
        />
        <Select
          style={{ width: 160 }}
          allowClear
          placeholder="Khoa"
          value={filters.khoa}
          onChange={(v) => setFilters((f) => ({ ...f, khoa: v, page: 1 }))}
          options={[
            // TODO: thay bằng danh sách khoa lấy từ API thực tế
            { value: 'cntt', label: 'Khoa CNTT' },
            { value: 'nong-hoc', label: 'Khoa Nông học' },
            { value: 'co-dien', label: 'Khoa Cơ điện' },
          ]}
        />
        <Select
          style={{ width: 160 }}
          allowClear
          placeholder="Trạng thái"
          value={filters.trangThai}
          onChange={(v) => setFilters((f) => ({ ...f, trangThai: v, page: 1 }))}
          options={Object.keys(STATUS_TAG).map((key) => ({ value: key, label: key }))}
        />
      </Space>

      <Table
        rowKey="MaDT"
        loading={loading}
        dataSource={data}
        pagination={{
          current: filters.page,
          pageSize: filters.limit,
          total,
          onChange: (page, pageSize) => setFilters((f) => ({ ...f, page, limit: pageSize })),
        }}
        columns={[
          { title: 'Mã ĐT', dataIndex: 'MaDT', width: 90 },
          { title: 'Tên đề tài', dataIndex: 'TenDT' },
          { title: 'Phân loại', dataIndex: 'PhanLoai', width: 100 },
          { title: 'Khoa', dataIndex: 'Khoa', width: 140 },
          {
            title: 'Chủ nhiệm',
            width: 160,
            render: (_, record: TopicLoad) => record.NhomTruong?.TenDayDu ?? '—',
          },
          {
            title: 'Tiến độ',
            dataIndex: 'progress',
            width: 140,
            render: (v: number | undefined) => (
              <Progress percent={v ?? 0} size="small" showInfo={false} />
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'TrangThai',
            width: 140,
            render: (v: string) => (
              <Tag color={STATUS_TAG[v]?.color ?? 'default'}>{STATUS_TAG[v]?.text ?? v}</Tag>
            ),
          },
          {
            title: 'Thao tác',
            width: 90,
            render: (_, record: TopicLoad) => (
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/mainhome/tra-cuu-de-tai/${record.MaDT}`)}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

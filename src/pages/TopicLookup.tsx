import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Empty, Input, Modal, Progress, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { EyeOutlined, ExportOutlined, InfoCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { lookupTopics, type TopicLoad } from '../services/topic/TopicService';
import RichTextEditor from '../components/common/RichTextEditor';

const { Text } = Typography;
const statusColors: Record<string, string> = { 'Nháp': 'default', 'Chờ phê duyệt': 'gold', 'Chờ xét duyệt': 'gold', 'Từ chối': 'red', 'Đã phê duyệt': 'blue', 'Bắt đầu': 'cyan', 'Đang thực hiện': 'blue', 'Chờ phân công hội đồng thanh lý': 'volcano', 'Chờ thanh lý': 'orange', 'Đã thanh lý': 'default', 'Chờ nghiệm thu': 'purple', 'Đang nghiệm thu': 'purple', 'Đã nghiệm thu': 'green' };
const progressColor = (progress: number) => progress >= 100 ? '#299b5e' : progress < 50 ? '#d97706' : '#2f9b65';

const getCleanPlainText = (html?: string): string => {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return (doc.body.textContent || doc.body.innerText || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

export default function TopicLookup({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'name' | 'content'>('all');
  const [status, setStatus] = useState<string>();
  const [department, setDepartment] = useState<string>();
  const [academicYear, setAcademicYear] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicLoad | null>(null);

  const getPlaceholder = () => {
    switch (searchType) {
      case 'content':
        return 'Tìm theo nội dung, mô tả tóm tắt đề tài...';
      case 'name':
        return 'Tìm theo tên hoặc mã đề tài...';
      default:
        return 'Tìm theo tên hoặc nội dung đề tài...';
    }
  };

  const search = async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      message.warning('Vui lòng nhập từ khóa trước khi tìm kiếm');
      return;
    }
    setLoading(true); setSearched(true);
    try {
      const result = await lookupTopics({
        keyword: normalizedKeyword,
        searchType,
        trangThai: status,
        khoa: department,
        namHoc: academicYear,
        page: 1,
        limit: 20,
      });
      setTopics(result.data); setTotal(result.total);
    } catch (error) {
      console.error('Lỗi tra cứu đề tài:', error); message.error('Không thể tra cứu đề tài');
    } finally { setLoading(false); }
  };

  const departments = useMemo(() => Array.from(new Map(topics.filter((topic) => topic.Khoa).map((topic) => [topic.Khoa!, topic.TenKhoa || topic.Khoa!])).entries()).map(([value, label]) => ({ value, label })), [topics]);
  const statuses = useMemo(() => Array.from(new Set(topics.map((topic) => topic.TrangThai).filter(Boolean))).map((value) => ({ value, label: value })), [topics]);
  const reset = () => { setKeyword(''); setSearchType('all'); setStatus(undefined); setDepartment(undefined); setAcademicYear(undefined); setTopics([]); setTotal(0); setSearched(false); };

  const handleOpenDetail = (topic: TopicLoad) => {
    setSelectedTopic(topic);
  };

  const handleGoToTopic = (topic: TopicLoad) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      message.info('Vui lòng đăng nhập để xem toàn bộ hồ sơ và chi tiết đề tài');
      navigate('/login');
      return;
    }
    navigate(`/mainhome/topic/${topic.MaDT}`);
  };

  return (
    <div style={{ background: compact ? 'transparent' : '#f7faf7', borderRadius: compact ? 0 : 24, padding: compact ? 0 : 20 }}>
      <Space.Compact style={{ width: '100%', maxWidth: compact ? '100%' : 720, display: 'flex' }}>
        <Input size={compact ? 'middle' : 'large'} prefix={<SearchOutlined style={{ color: '#5c7370' }} />} value={keyword} placeholder={getPlaceholder()} onChange={(event) => setKeyword(event.target.value)} onPressEnter={search} style={{ height: compact ? 34 : 48, borderRadius: 28, paddingInline: 14 }} />
        <Button type="primary" size={compact ? 'middle' : 'large'} onClick={search} loading={loading} disabled={!keyword.trim()} style={{ height: compact ? 34 : 48, minWidth: compact ? 108 : 126, borderRadius: 28, marginLeft: 8, fontWeight: 600 }}>Tìm kiếm</Button>
      </Space.Compact>
      <Space wrap style={{ marginTop: 14 }}>
        <Select
          value={searchType}
          style={{ width: 185 }}
          options={[
            { value: 'all', label: 'Tất cả (Tên & Nội dung)' },
            { value: 'name', label: 'Chỉ tìm tên đề tài' },
            { value: 'content', label: 'Chỉ tìm theo nội dung' },
          ]}
          onChange={setSearchType}
        />
        <Select allowClear value={department} placeholder="Khoa / Bộ môn" style={{ width: 160 }} options={departments} onChange={setDepartment} />
        <Select allowClear value={academicYear} placeholder="Năm học" style={{ width: 120 }} options={[{ value: '2025-2026', label: '2025-2026' }, { value: '2024-2025', label: '2024-2025' }, { value: '2023-2024', label: '2023-2024' }]} onChange={setAcademicYear} />
        <Select allowClear value={status} placeholder="Trạng thái" style={{ width: 150 }} options={statuses} onChange={setStatus} />
        <Button type="text" icon={<ReloadOutlined />} onClick={reset} style={{ color: '#14743b' }}>Đặt lại</Button>
      </Space>
      {searched && <Text type="secondary" style={{ display: 'block', marginTop: 18 }}>Tìm thấy {total} đề tài</Text>}
      <Spin spinning={loading}>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {searched && !loading && topics.length === 0 && <Empty description="Không tìm thấy đề tài phù hợp" />}
          {topics.map((topic) => {
            const progress = Number(topic.TienDo ?? topic.progress ?? 0);
            const advisor = topic.NguoiHD?.NguoiDung?.TenDayDu || 'Chưa cập nhật';
            const leader = topic.NhomTruong?.TenDayDu || 'Chưa cập nhật';
            const cleanMoTa = getCleanPlainText(topic.MoTa);
            return (
              <div
                key={topic.MaDT}
                onClick={() => handleOpenDetail(topic)}
                style={{
                  background: '#fff',
                  border: '1px solid #dfe7e1',
                  borderRadius: 14,
                  padding: compact ? '12px 14px' : '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#14743b')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#dfe7e1')}
              >
                <Progress
                  type="circle"
                  percent={progress}
                  width={compact ? 40 : 48}
                  strokeWidth={9}
                  strokeColor={progressColor(progress)}
                  format={(value) => <span style={{ fontSize: compact ? 9 : 11, fontWeight: 700 }}>{value}%</span>}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Space size={8} wrap>
                    <Text style={{ color: '#59726c', fontSize: 12, fontWeight: 600 }}>#{topic.MaDT}</Text>
                    <Tag color={statusColors[topic.TrangThai] || 'default'} bordered={false}>{topic.TrangThai}</Tag>
                  </Space>
                  <div style={{ fontSize: compact ? 13 : 16, fontWeight: 650, color: '#17352a', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {topic.TenDT}
                  </div>
                  {cleanMoTa && (
                    <div style={{ fontSize: 12, color: '#59726c', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#335047' }}>Mô tả: </span>
                      {cleanMoTa}
                    </div>
                  )}
                  {!compact && (
                    <Text type="secondary" style={{ fontSize: 13, marginTop: 2, display: 'block' }}>
                      GVHD: {advisor} · SV: {leader} · {topic.TenKhoa || topic.Khoa || 'Chưa cập nhật khoa'}
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  ghost
                  size={compact ? 'small' : 'middle'}
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(topic);
                  }}
                  style={{
                    borderRadius: 8,
                    color: '#14743b',
                    borderColor: '#14743b',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {compact ? 'Chi tiết' : 'Xem chi tiết'}
                </Button>
              </div>
            );
          })}
        </div>
      </Spin>
      <Modal
        title={
          selectedTopic ? (
            <Space wrap align="center" style={{ width: '100%', justifyContent: 'space-between', paddingRight: 24 }}>
              <Space wrap align="center">
                <Text strong style={{ fontSize: 16 }}>Chi tiết đề tài #{selectedTopic.MaDT}</Text>
                <Tag color={statusColors[selectedTopic.TrangThai] || 'default'}>{selectedTopic.TrangThai}</Tag>
              </Space>
            </Space>
          ) : 'Thông tin đề tài'
        }
        open={Boolean(selectedTopic)}
        footer={
          selectedTopic ? (
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setSelectedTopic(null)}>Đóng</Button>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                style={{ background: '#14743b' }}
                onClick={() => handleGoToTopic(selectedTopic)}
              >
                Đến trang đề tài
              </Button>
            </Space>
          ) : null
        }
        onCancel={() => setSelectedTopic(null)}
        width={760}
      >
        {selectedTopic && (
          <div style={{ paddingTop: 8 }}>
            <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 16, color: '#14743b' }}>
              {selectedTopic.TenDT}
            </Typography.Title>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 2 }}>
              <Descriptions.Item label="Mã đề tài">#{selectedTopic.MaDT}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColors[selectedTopic.TrangThai] || 'default'}>{selectedTopic.TrangThai}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Giảng viên HD">
                {selectedTopic.NguoiHD?.NguoiDung?.TenDayDu || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm / Nhóm trưởng">
                {selectedTopic.NhomTruong?.TenDayDu || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Khoa / Đơn vị">
                {selectedTopic.TenKhoa || selectedTopic.Khoa || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Chuyên ngành">
                {selectedTopic.TenChuyenNganh || selectedTopic.ChuyenNganh || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Phân loại">
                {selectedTopic.PhanLoai || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tiến độ thực hiện">
                <Progress percent={Number(selectedTopic.TienDo ?? selectedTopic.progress ?? 0)} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian thực hiện" span={2}>
                {selectedTopic.NgayBatDau ? new Date(selectedTopic.NgayBatDau).toLocaleDateString('vi-VN') : '—'}
                {' – '}
                {selectedTopic.NgayKetThuc ? new Date(selectedTopic.NgayKetThuc).toLocaleDateString('vi-VN') : '—'}
              </Descriptions.Item>
              {selectedTopic.TongKinhPhi ? (
                <Descriptions.Item label="Tổng kinh phí" span={2}>
                  {Number(selectedTopic.TongKinhPhi).toLocaleString('vi-VN')} VNĐ
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#17352a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <InfoCircleOutlined style={{ color: '#14743b' }} />
                <span>Mô tả đề tài</span>
              </div>
              <RichTextEditor
                value={selectedTopic.MoTa}
                readOnly={true}
                placeholder="Chưa cập nhật mô tả cho đề tài này."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Button, Descriptions, Empty, Input, Modal, Progress, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { ReloadOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { lookupTopics, type TopicLoad } from '../services/topic/TopicService';
import DOMPurify from 'dompurify';
const { Paragraph, Text } = Typography;
const statusColors: Record<string, string> = { 'Nháp': 'default', 'Chờ phê duyệt': 'gold', 'Chờ xét duyệt': 'gold', 'Từ chối': 'red', 'Đã phê duyệt': 'blue', 'Bắt đầu': 'cyan', 'Đang thực hiện': 'blue', 'Chờ nghiệm thu': 'purple', 'Đang nghiệm thu': 'purple', 'Đã nghiệm thu': 'green' };
const progressColor = (progress: number) => progress >= 100 ? '#299b5e' : progress < 50 ? '#d97706' : '#2f9b65';

export default function TopicLookup({ compact = false }: { compact?: boolean }) {
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [department, setDepartment] = useState<string>();
  const [academicYear, setAcademicYear] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicLoad | null>(null);

  const search = async () => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      message.warning('Vui lòng nhập tên đề tài trước khi tìm kiếm');
      return;
    }
    setLoading(true); setSearched(true);
    try {
      const result = await lookupTopics({ keyword: normalizedKeyword, trangThai: status, khoa: department, namHoc: academicYear, page: 1, limit: 20 });
      setTopics(result.data); setTotal(result.total);
    } catch (error) {
      console.error('Lỗi tra cứu đề tài:', error); message.error('Không thể tra cứu đề tài');
    } finally { setLoading(false); }
  };

  const departments = useMemo(() => Array.from(new Map(topics.filter((topic) => topic.Khoa).map((topic) => [topic.Khoa!, topic.TenKhoa || topic.Khoa!])).entries()).map(([value, label]) => ({ value, label })), [topics]);
  const statuses = useMemo(() => Array.from(new Set(topics.map((topic) => topic.TrangThai).filter(Boolean))).map((value) => ({ value, label: value })), [topics]);
  const reset = () => { setKeyword(''); setStatus(undefined); setDepartment(undefined); setAcademicYear(undefined); setTopics([]); setTotal(0); setSearched(false); };

  return (
    <div style={{ background: compact ? 'transparent' : '#f7faf7', borderRadius: compact ? 0 : 24, padding: compact ? 0 : 20 }}>
      <Space.Compact style={{ width: '100%', maxWidth: compact ? '100%' : 720, display: 'flex' }}>
        <Input size={compact ? 'middle' : 'large'} prefix={<SearchOutlined style={{ color: '#5c7370' }} />} value={keyword} placeholder="Tìm theo tên đề tài..." onChange={(event) => setKeyword(event.target.value)} onPressEnter={search} style={{ height: compact ? 34 : 48, borderRadius: 28, paddingInline: 14 }} />
        <Button type="primary" size={compact ? 'middle' : 'large'} onClick={search} loading={loading} disabled={!keyword.trim()} style={{ height: compact ? 34 : 48, minWidth: compact ? 108 : 126, borderRadius: 28, marginLeft: 8, fontWeight: 600 }}>Tìm kiếm</Button>
      </Space.Compact>
      <Space wrap style={{ marginTop: 14 }}>
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
            return <div key={topic.MaDT} style={{ background: '#fff', border: '1px solid #dfe7e1', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress type="circle" percent={progress} width={compact ? 38 : 48} strokeWidth={10} strokeColor={progressColor(progress)} format={(value) => <span style={{ fontSize: compact ? 9 : 11, fontWeight: 700 }}>{value}%</span>} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <Space size={8} wrap><Text style={{ color: '#59726c', fontSize: 12 }}>{topic.MaDT}</Text><Tag color={statusColors[topic.TrangThai] || 'default'} bordered={false}>{topic.TrangThai}</Tag></Space>
                <div style={{ fontSize: compact ? 12 : 16, fontWeight: 650, color: '#17352a', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.TenDT}</div>
                {!compact && <Text type="secondary" style={{ fontSize: 13 }}>GVHD: {advisor} · SV: {leader} · {topic.TenKhoa || topic.Khoa || 'Chưa cập nhật khoa'}</Text>}
              </div>
              <Button type="text" aria-label={`Xem ${topic.TenDT}`} icon={<RightOutlined />} onClick={() => setSelectedTopic(topic)} style={{ color: '#75847b' }} />
            </div>;
          })}
        </div>
      </Spin>
      <Modal title="Thông tin đề tài" open={Boolean(selectedTopic)} footer={<Button onClick={() => setSelectedTopic(null)}>Đóng</Button>} onCancel={() => setSelectedTopic(null)} width={720}>
        {selectedTopic && <><Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Mã đề tài">{selectedTopic.MaDT}</Descriptions.Item><Descriptions.Item label="Tên đề tài">{selectedTopic.TenDT}</Descriptions.Item>
          <Descriptions.Item label="Giảng viên hướng dẫn">{selectedTopic.NguoiHD?.NguoiDung?.TenDayDu || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Nhóm trưởng">{selectedTopic.NhomTruong?.TenDayDu || 'Chưa cập nhật'}</Descriptions.Item>
          <Descriptions.Item label="Khoa / chuyên ngành">{selectedTopic.TenKhoa || selectedTopic.Khoa || '—'} / {selectedTopic.TenChuyenNganh || selectedTopic.ChuyenNganh || '—'}</Descriptions.Item><Descriptions.Item label="Trạng thái"><Tag color={statusColors[selectedTopic.TrangThai] || 'default'}>{selectedTopic.TrangThai}</Tag></Descriptions.Item>
          <Descriptions.Item label="Tiến độ"><Progress percent={Number(selectedTopic.TienDo ?? selectedTopic.progress ?? 0)} size="small" /></Descriptions.Item><Descriptions.Item label="Thời gian thực hiện">{selectedTopic.NgayBatDau ? new Date(selectedTopic.NgayBatDau).toLocaleDateString('vi-VN') : '—'} – {selectedTopic.NgayKetThuc ? new Date(selectedTopic.NgayKetThuc).toLocaleDateString('vi-VN') : '—'}</Descriptions.Item>
        </Descriptions><Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
            <strong>Mô tả tóm tắt: </strong>
            {selectedTopic.MoTa ? (
              <span
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTopic.MoTa) }}
              />
            ) : (
              'Chưa cập nhật mô tả.'
            )}
          </Paragraph></>}
      </Modal>
    </div>
  );
}

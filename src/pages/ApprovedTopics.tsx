import { useEffect, useState } from 'react';
import { Button, Space, Spin, Table, Tag, message } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDeTaiTheoHoiDong } from '../services/progress/ProgressService';
import type { DeTaiTheoDoi } from '../services/progress/ProgressService';

export default function ApprovedTopics() {
  const [topics, setTopics] = useState<DeTaiTheoDoi[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => { (async () => { try { setTopics(await getDeTaiTheoHoiDong()); } catch { message.error('Không tải được đề tài được phân công'); } finally { setLoading(false); } })(); }, []);
  return <div style={{ padding: 20 }}><h2>Đề tài được phân công cho hội đồng</h2><Spin spinning={loading}><Table rowKey="MaDT" dataSource={topics} columns={[
    { title: 'Mã đề tài', dataIndex: 'MaDT', width: 120 }, { title: 'Tên đề tài', dataIndex: 'TenDT' }, { title: 'Hội đồng', dataIndex: 'TenHoiDong', width: 220 },
    { title: 'Nghiệp vụ', dataIndex: 'NghiepVuHoiDong', width: 130, render: (value: string) => <Tag>{value}</Tag> }, { title: 'Chủ nhiệm', dataIndex: 'ChuNhiem', width: 150 },
    { title: 'Thành viên hội đồng', width: 240, render: (_: unknown, row: DeTaiTheoDoi) => row.ThanhVienHoiDong?.map((member) => `${member.TenDayDu} (${member.ChucDanh})`).join(', ') || '—' },
    { title: 'Thao tác', width: 220, render: (_: unknown, row: DeTaiTheoDoi) => <Space size={8} wrap={false}>
      <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/mainhome/topic-committee/${row.MaDT}`)}>Chi tiết</Button>
      {row.NghiepVuHoiDong === 'monitoring' && <Button size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/mainhome/hoi-dong-theo-doi/${row.MaDT}`)}>Báo cáo</Button>}
      {row.NghiepVuHoiDong === 'scoring' && <Button size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/mainhome/acceptance/${row.MaDT}`)}>Nghiệm thu</Button>}
    </Space> },
  ]} /></Spin></div>;
}

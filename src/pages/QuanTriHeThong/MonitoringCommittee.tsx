import { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Tag, Progress, Button, message, Input, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getDeTaiDuocGan } from '../ThongTinDeTai/ProgressService';
import type { DeTaiTheoDoi } from '../ThongTinDeTai/ProgressService';

const mauTrangThai: Record<string, string> = {
  'Bắt đầu': 'processing',
  'Đã phê duyệt': 'processing',
  'Đang thực hiện': 'processing',
  'Chờ nghiệm thu': 'gold',
  'Chờ thanh lý': 'error',
  'Đã thanh lý': 'default',
  'Hoàn thành': 'success',
  DangThucHien: 'processing',
  ChoNghiemThu: 'gold',
  ChoThanhLy: 'error',
  DaThanhLy: 'default',
  HoanThanh: 'success',
};

const nhanTrangThai: Record<string, string> = {
  'Bắt đầu': 'Bắt đầu',
  'Đã phê duyệt': 'Bắt đầu',
  'Đang thực hiện': 'Đang thực hiện',
  'Chờ nghiệm thu': 'Chờ nghiệm thu',
  'Chờ thanh lý': 'Chờ thanh lý',
  'Đã thanh lý': 'Đã thanh lý',
  'Hoàn thành': 'Hoàn thành',
  DangThucHien: 'Đang thực hiện',
  ChoNghiemThu: 'Chờ nghiệm thu',
  ChoThanhLy: 'Chờ thanh lý',
  DaThanhLy: 'Đã thanh lý',
  HoanThanh: 'Hoàn thành',
};

type LocTienDo = 'all' | 'duoi50' | 'tu50den99' | 'du100';

export default function DanhSachDeTai() {
  const [danhSach, setDanhSach] = useState<DeTaiTheoDoi[]>([]);
  const [loading, setLoading] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [khoaLoc, setKhoaLoc] = useState<string>('all');
  const [tienDoLoc, setTienDoLoc] = useState<LocTienDo>('all');
  const navigate = useNavigate();

  const fetchDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeTaiDuocGan();
      setDanhSach(data);
    } catch {
      message.error('Không tải được danh sách đề tài');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDanhSach();
  }, [fetchDanhSach]);

  const dsKhoa = useMemo(
    () => Array.from(new Set(danhSach.map((d) => d.Khoa))).filter(Boolean),
    [danhSach],
  );

  const danhSachDaLoc = useMemo(() => {
    return danhSach.filter((d) => {
      const khopTuKhoa =
        !tuKhoa ||
        d.MaDT.toLowerCase().includes(tuKhoa.toLowerCase()) ||
        d.TenDT.toLowerCase().includes(tuKhoa.toLowerCase()) ||
        d.ChuNhiem.toLowerCase().includes(tuKhoa.toLowerCase());

      const khopKhoa = khoaLoc === 'all' || d.Khoa === khoaLoc;

      const khopTienDo =
        tienDoLoc === 'all' ||
        (tienDoLoc === 'duoi50' && d.TienDo < 50) ||
        (tienDoLoc === 'tu50den99' && d.TienDo >= 50 && d.TienDo < 100) ||
        (tienDoLoc === 'du100' && d.TienDo >= 100);

      return khopTuKhoa && khopKhoa && khopTienDo;
    });
  }, [danhSach, tuKhoa, khoaLoc, tienDoLoc]);

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="Tìm theo mã, tên đề tài, chủ nhiệm..."
          allowClear
          style={{ width: 280 }}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
        <Select
          value={khoaLoc}
          onChange={setKhoaLoc}
          style={{ width: 200 }}
          options={[
            { value: 'all', label: 'Tất cả khoa' },
            ...dsKhoa.map((k) => ({ value: k, label: k })),
          ]}
        />
        <Select
          value={tienDoLoc}
          onChange={setTienDoLoc}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: 'Tất cả tiến độ' },
            { value: 'duoi50', label: 'Dưới 50%' },
            { value: 'tu50den99', label: '50% - 99%' },
            { value: 'du100', label: '100%' },
          ]}
        />
      </Space>

      <Table
        rowKey="MaDT"
        loading={loading}
        dataSource={danhSachDaLoc}
        columns={[
          { title: 'Mã đề tài', dataIndex: 'MaDT', width: 100 },
          { title: 'Tên đề tài', dataIndex: 'TenDT' },
          { title: 'Chủ nhiệm', dataIndex: 'ChuNhiem', width: 150 },
          { title: 'Khoa', dataIndex: 'Khoa', width: 140 },
          {
            title: 'Tiến độ',
            dataIndex: 'TienDo',
            width: 160,
            render: (v: number) => <Progress percent={v} size="small" />,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'TrangThai',
            width: 150,
            render: (v: string) => <Tag color={mauTrangThai[v] || 'default'}>{nhanTrangThai[v] || v}</Tag>,
          },
          {
            title: '',
            width: 130,
            render: (_, record) => (
              <Button type="link" onClick={() => navigate(`/mainhome/hoi-dong-theo-doi/${record.MaDT}`)}>
                Xem báo cáo
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}

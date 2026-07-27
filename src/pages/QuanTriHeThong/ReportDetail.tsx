// src/pages/QuanTriHeThong/ReportDetail.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Collapse, Tag, Button, Modal, Form, Radio, Input, message, Space, Spin, Empty } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { downloadBaoCaoFile,getBaoCaoTheoDeTai , nhanXetBaoCao } from '../ThongTinDeTai/ProgressService';
import type { BaoCaoTienDo } from '../ThongTinDeTai/ProgressService';

type TrangThaiDuyetBaoCao = 'ChoDuyet' | 'Dat' | 'YeuCauBoSung' | 'CanDieuChinh' | 'KhongDat';

const TrangThaiDuyetBaoCao = {
  CHO_DUYET: 'ChoDuyet',
  DAT: 'Dat',
  YEU_CAU_BO_SUNG: 'YeuCauBoSung',
  CAN_DIEU_CHINH: 'CanDieuChinh',
  KHONG_DAT: 'KhongDat',
} as const;

const nhanTrangThai: Record<TrangThaiDuyetBaoCao, { text: string; color: string }> = {
  ChoDuyet: { text: 'Chờ duyệt', color: 'default' },
  Dat: { text: 'Đạt', color: 'success' },
  YeuCauBoSung: { text: 'Yêu cầu bổ sung', color: 'warning' },
  CanDieuChinh: { text: 'Cần điều chỉnh', color: 'orange' },
  KhongDat: { text: 'Không đạt', color: 'error' },
};

export default function ReportDetail() {
  const { maDT } = useParams<{ maDT: string }>();
  const [danhSach, setDanhSach] = useState<BaoCaoTienDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [dangXuLy, setDangXuLy] = useState<BaoCaoTienDo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchDanhSach = useCallback(async () => {
    if (!maDT) return;
    setLoading(true);
    try {
      const data = await getBaoCaoTheoDeTai(maDT);
      setDanhSach(data);
    } catch {
      message.error('Không tải được danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  }, [maDT]);

  useEffect(() => {
    fetchDanhSach();
  }, [fetchDanhSach]);

  const openModal = (record: BaoCaoTienDo) => {
    setDangXuLy(record);
    form.resetFields();
  };

  const handleSubmit = async () => {
    if (!dangXuLy) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await nhanXetBaoCao(dangXuLy.Id, values);
      message.success('Đã gửi nhận xét');
      setDangXuLy(null);
      fetchDanhSach();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('Gửi nhận xét thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3>Báo cáo tiến độ - {maDT}</h3>

      <Spin spinning={loading}>
        {danhSach.length === 0 && !loading ? (
          <Empty description="Chưa có báo cáo nào" />
        ) : (
          <Collapse
            items={danhSach.map((record) => ({
              key: record.Id,
              label: (
                <Space size="middle">
                  <span style={{ fontWeight: 500 }}>{record.KyBaoCao}</span>
                  <span style={{ color: '#888' }}>{record.TaiKhoanNguoiGui}</span>
                  <span>{record.TienDoBaoCao}%</span>
                  <span style={{ color: '#888' }}>{record.NgayGui}</span>
                  <Tag color={nhanTrangThai[record.TrangThaiDuyet].color}>
                    {nhanTrangThai[record.TrangThaiDuyet].text}
                  </Tag>
                </Space>
              ),
              children: (
                <div>
                  <p><strong>Nội dung:</strong> {record.NoiDungBaoCao}</p>
                  <p><strong>Khó khăn:</strong> {record.KhoKhan || '—'}</p>
                  <p><strong>Đề xuất:</strong> {record.DeXuat || '—'}</p>
                  {record.TenFile && (
                    <p>
                      <strong>File minh chứng:</strong>{' '}
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadBaoCaoFile(record.MaTL!, record.TenFile!)}
                      >
                        {record.TenFile}
                      </Button>
                    </p>
                  )}
                  {record.NhanXetHoiDong && (
                    <p><strong>Nhận xét hội đồng:</strong> {record.NhanXetHoiDong}</p>
                  )}
                  {record.TrangThaiDuyet === TrangThaiDuyetBaoCao.CHO_DUYET && (
                    <Button type="primary" onClick={() => openModal(record)}>
                      Nhận xét
                    </Button>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Spin>

      <Modal
        title="Nhận xét báo cáo tiến độ"
        open={!!dangXuLy}
        onCancel={() => setDangXuLy(null)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="Gửi"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="TrangThaiDuyet" label="Kết quả" rules={[{ required: true, message: 'Chọn kết quả' }]}>
            <Radio.Group>
              <Radio value={TrangThaiDuyetBaoCao.DAT}>Đạt</Radio>
              <Radio value={TrangThaiDuyetBaoCao.YEU_CAU_BO_SUNG}>Yêu cầu bổ sung</Radio>
              <Radio value={TrangThaiDuyetBaoCao.CAN_DIEU_CHINH}>Cần điều chỉnh</Radio>
              <Radio value={TrangThaiDuyetBaoCao.KHONG_DAT}>Không đạt / đề xuất thanh lý</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="NhanXetHoiDong" label="Nhận xét chi tiết" rules={[{ required: true, message: 'Nhập nhận xét' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
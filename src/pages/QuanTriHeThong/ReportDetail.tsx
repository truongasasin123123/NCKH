import { useCallback, useEffect, useState } from 'react';
import { Button, Collapse, Empty, Form, Input, Modal, Radio, Space, Spin, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { downloadDocument } from '../ThongTinDeTai/DocumentsService';
import { getBaoCaoTheoDeTai, nhanXetBaoCao } from '../ThongTinDeTai/ProgressService';
import type { BaoCaoTienDo } from '../ThongTinDeTai/ProgressService';

const statusColor: Record<string, string> = { 'Nháp': 'default', 'Đã gửi': 'processing', 'Yêu cầu bổ sung': 'warning', 'Đạt': 'success', 'Không đạt': 'error' };

export default function ReportDetail() {
  const { maDT } = useParams<{ maDT: string }>();
  const [reports, setReports] = useState<BaoCaoTienDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BaoCaoTienDo>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!maDT) return;
    try { setLoading(true); setReports(await getBaoCaoTheoDeTai(maDT)); }
    catch { message.error('Không tải được báo cáo tiến độ'); }
    finally { setLoading(false); }
  }, [maDT]);
  useEffect(() => { load(); }, [load]);

  const review = async () => {
    if (!selected) return;
    try {
      const values = await form.validateFields(); setSaving(true);
      await nhanXetBaoCao(selected.Id, values.decision, values.note);
      message.success('Đã gửi phản hồi'); setSelected(undefined); await load();
    } catch (error: any) { if (!error?.errorFields) message.error('Gửi phản hồi thất bại'); }
    finally { setSaving(false); }
  };

  return <Spin spinning={loading}>
    <h3>Báo cáo tiến độ — {maDT}</h3>
    {reports.length === 0 ? <Empty description="Chưa có báo cáo" /> : <Collapse items={reports.map((report) => ({
      key: report.Id,
      label: <Space><b>{report.MocDeTai?.TenMoc || report.KyBaoCao}</b><Tag color={statusColor[report.TrangThai]}>{report.TrangThai}</Tag><span>{report.TienDoBaoCao ?? 0}%</span></Space>,
      children: <div>
        <p><b>Nội dung:</b> {report.NoiDungBaoCao}</p><p><b>Khó khăn:</b> {report.KhoKhan || '—'}</p><p><b>Đề xuất:</b> {report.DeXuat || '—'}</p>
        {report.TaiLieu?.map((file) => <Button key={file.MaTL} size="small" icon={<DownloadOutlined />} style={{ marginRight: 8 }} onClick={() => downloadDocument(file.MaTL, file.TenFile)}>{file.TenFile}</Button>)}
        {report.NhanXetHoiDong && <p><b>Nhận xét:</b> {report.NhanXetHoiDong}</p>}
        {report.TrangThai === 'Đã gửi' && <Button type="primary" onClick={() => { form.resetFields(); setSelected(report); }}>Phản hồi</Button>}
      </div>,
    }))} />}
    <Modal title="Phản hồi báo cáo" open={!!selected} onCancel={() => setSelected(undefined)} onOk={review} confirmLoading={saving} okText="Gửi">
      <Form form={form} layout="vertical"><Form.Item name="decision" label="Kết quả" rules={[{ required: true }]}><Radio.Group><Radio value="accepted">Đạt</Radio><Radio value="supplement">Yêu cầu bổ sung</Radio><Radio value="rejected">Không đạt</Radio></Radio.Group></Form.Item><Form.Item name="note" label="Nhận xét" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item></Form>
    </Modal>
  </Spin>;
}

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Collapse, Empty, Form, Input, Modal, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadDocument } from '../../services/topic/DocumentsService';
import { getBaoCaoTheoDeTai, getDeTaiDuocGan, nhanXetBaoCao } from '../../services/progress/ProgressService';
import type { BaoCaoTienDo } from '../../services/progress/ProgressService';
import ReportConclusionModal from '../../components/progress-management/ReportConclusionModal';

const statusColor: Record<string, string> = {
  'Nháp': 'default',
  'Đã gửi': 'processing',
  'Yêu cầu bổ sung': 'warning',
  'Yêu cầu điều chỉnh': 'error',
  'Đề xuất thanh lý': 'volcano',
  'Đạt': 'success',
  'Không đạt': 'error',
};

export default function ReportDetail() {
  const { maDT } = useParams<{ maDT: string }>();
  const navigate = useNavigate();
  const [reports, setReports] = useState<BaoCaoTienDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BaoCaoTienDo>();
  const [reviewing, setReviewing] = useState<BaoCaoTienDo>();
  const [canFinalize, setCanFinalize] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm] = Form.useForm<{ note: string }>();

 
  const load = useCallback(async () => {
    if (!maDT) return;
    try {
      setLoading(true);
      const [reportData, projects] = await Promise.all([
        getBaoCaoTheoDeTai(maDT),
        getDeTaiDuocGan(),
      ]);
      setReports(reportData);
      const membership = projects.find((project) => project.MaDT === maDT);
      const normalizedPosition = membership?.VaiTroTrongHoiDong
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd');
      setCanFinalize(
        membership?.NghiepVuHoiDong === 'monitoring'
        && Boolean(normalizedPosition?.includes('chu tich')),
      );
    }
    catch { message.error('Không tải được báo cáo tiến độ'); }
    finally { setLoading(false); }
  }, [maDT]);
  useEffect(() => { load(); }, [load]);

  const submitReview = async () => {
    try {
      const { note } = await reviewForm.validateFields();
      if (!reviewing) return;
      setSubmittingReview(true);
      await nhanXetBaoCao(reviewing.Id, note);
      message.success('Đã gửi nhận xét cho nhóm trưởng');
      reviewForm.resetFields();
      setReviewing(undefined);
      await load();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      console.error('Lỗi khi gửi nhận xét:', error);
      message.error('Không thể gửi nhận xét');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 0' }}>
      <Spin spinning={loading}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/mainhome/approvedtopics')}
          style={{ marginBottom: 12 }}
        >
          Quay lại đề tài hội đồng
        </Button>

        <Card
          styles={{ body: { padding: 20 } }}
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1677ff' }} />
              <Typography.Title level={4} style={{ margin: 0 }}>
                Báo cáo tiến độ
              </Typography.Title>
            </Space>
          }
          extra={<Tag color="blue">{maDT}</Tag>}
        >
          {reports.length === 0 ? (
            <Empty description="Chưa có báo cáo cho đề tài này" />
          ) : (
            <Collapse
              bordered={false}
              items={reports.map((report) => ({
                key: report.Id,
                label: (
                  <Space>
                    <b>{report.MocDeTai?.TenMoc || report.KyBaoCao}</b>
                    <Tag color={statusColor[report.TrangThai]}>{report.TrangThai}</Tag>
                    <span>{report.TienDoBaoCao ?? 0}%</span>
                  </Space>
                ),
                children: (
                  <div style={{ lineHeight: 1.8 }}>
                    <p><b>Nội dung:</b> {report.NoiDungBaoCao}</p>
                    <p><b>Khó khăn:</b> {report.KhoKhan || '—'}</p>
                    <p><b>Đề xuất:</b> {report.DeXuat || '—'}</p>

                    <div style={{ margin: '14px 0' }}>
                      <b>Tài liệu minh chứng:</b>
                      <div style={{ marginTop: 8 }}>
                        {report.TaiLieu?.length
                          ? report.TaiLieu.map((file) => (
                              <Button
                                key={file.MaTL}
                                size="small"
                                icon={<DownloadOutlined />}
                                style={{ marginRight: 8, marginBottom: 6 }}
                                onClick={() => downloadDocument(file.MaTL, file.TenFile)}
                              >
                                {file.TenFile}
                              </Button>
                            ))
                          : ' Chưa có tài liệu'}
                      </div>
                    </div>

                    {report.PhanHoi?.length ? (
                      <div style={{ marginBottom: 12 }}>
                        <Collapse
                          size="small"
                          items={[
                            {
                              key: `feedback-${report.Id}`,
                              label: `Lịch sử phản hồi (${report.PhanHoi.length})`,
                              children: (
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                  {report.PhanHoi.map((feedback) => (
                                    <Card key={feedback.Id} size="small" style={{ background: '#fafafa' }}>
                                      <Tag color={statusColor[feedback.KetQua] || 'default'}>{feedback.KetQua}</Tag>
                                      {feedback.NhanXet}
                                      <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                                        {feedback.NguoiHoiDong?.TenDayDu || feedback.NguoiHoiDong?.TaiKhoan || 'Hội đồng'}
                                        {' · '}
                                        {new Date(feedback.NgayPhanHoi).toLocaleString('vi-VN')}
                                      </div>
                                    </Card>
                                  ))}
                                </Space>
                              ),
                            },
                          ]}
                        />
                      </div>
                    ) : null}

                    {report.NhanXetHoiDong && (
                      <Card size="small" style={{ background: '#f6ffed', marginBottom: 12 }}>
                        <b>Kết luận Chủ tịch:</b>
                        <br />
                        {report.NhanXetHoiDong}
                        {report.NguoiHoiDong && (
                          <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                            {report.NguoiHoiDong.TenDayDu || report.NguoiHoiDong.TaiKhoan}
                            {report.NgayPhanHoi ? ` · ${new Date(report.NgayPhanHoi).toLocaleString('vi-VN')}` : ''}
                          </div>
                        )}
                      </Card>
                    )}

                    {report.TrangThai === 'Đã gửi' && (
                      <Space wrap>
                        <Button onClick={() => setReviewing(report)}>Thêm nhận xét</Button>
                        {canFinalize && (
                          <Button type="primary" onClick={() => setSelected(report)}>
                            Chốt kết luận
                          </Button>
                        )}
                      </Space>
                    )}
                  </div>
                ),
              }))}
            />
          )}
        </Card>

        {selected && (
          <ReportConclusionModal
            open={!!selected}
            reportId={selected.Id}
            onClose={() => setSelected(undefined)}
            onSuccess={load}
          />
        )}
        <Modal
          title="Thêm nhận xét báo cáo"
          open={!!reviewing}
          onCancel={() => {
            reviewForm.resetFields();
            setReviewing(undefined);
          }}
          onOk={submitReview}
          confirmLoading={submittingReview}
          okText="Gửi nhận xét"
          cancelText="Hủy"
        >
          <Form form={reviewForm} layout="vertical">
            <Form.Item
              name="note"
              label="Nội dung nhận xét"
              rules={[{ required: true, whitespace: true, message: 'Nhập nội dung nhận xét' }]}
            >
              <Input.TextArea rows={4} placeholder="Nhận xét của bạn sẽ được gửi tới nhóm trưởng." />
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Collapse, Empty, Space, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadDocument } from '../../services/topic/DocumentsService';
import { getBaoCaoTheoDeTai } from '../../services/progress/ProgressService';
import type { BaoCaoTienDo } from '../../services/progress/ProgressService';
import ReportConclusionModal from '../../components/progress-management/ReportConclusionModal';

const statusColor: Record<string, string> = { 'Nháp': 'default', 'Đã gửi': 'processing', 'Yêu cầu bổ sung': 'warning', 'Đạt': 'success', 'Không đạt': 'error' };

export default function ReportDetail() {
  const { maDT } = useParams<{ maDT: string }>();
  const navigate = useNavigate();
  const [reports, setReports] = useState<BaoCaoTienDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<BaoCaoTienDo>();

 
  const load = useCallback(async () => {
    if (!maDT) return;
    try { setLoading(true); setReports(await getBaoCaoTheoDeTai(maDT)); }
    catch { message.error('Không tải được báo cáo tiến độ'); }
    finally { setLoading(false); }
  }, [maDT]);
  useEffect(() => { load(); }, [load]);

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
                        <b>Lịch sử phản hồi:</b>
                        {report.PhanHoi.map((feedback) => (
                          <Card
                            key={feedback.Id}
                            size="small"
                            style={{ marginTop: 8, background: '#fafafa' }}
                          >
                            <Tag color={statusColor[feedback.KetQua]}>{feedback.KetQua}</Tag>
                            {feedback.NhanXet}
                            <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                              {feedback.NguoiHoiDong?.TenDayDu || feedback.NguoiHoiDong?.TaiKhoan || 'Hội đồng'}
                              {' · '}
                              {new Date(feedback.NgayPhanHoi).toLocaleString('vi-VN')}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : null}

                    {report.NhanXetHoiDong && (
                      <Card size="small" style={{ background: '#f6ffed', marginBottom: 12 }}>
                        <b>Nhận xét hội đồng:</b>
                        <br />
                        {report.NhanXetHoiDong}
                      </Card>
                    )}

                    {report.TrangThai === 'Đã gửi' && (
                      <Button type="primary" onClick={() => setSelected(report)}>
                        Chốt kết luận
                      </Button>
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
      </Spin>
    </div>
  );
}
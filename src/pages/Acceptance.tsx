import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Tabs,
  Upload,
  message,
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, FileAddOutlined } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { downloadDocument, uploadDocument } from '../services/topic/DocumentsService';
import {
  createAcceptanceDraft,
  finalizeAcceptance,
  getAcceptanceByProject,
  submitAcceptance,
  submitAcceptanceScore,
} from '../services/topic/AcceptanceService';
import type { HoSoNghiemThu } from '../services/topic/AcceptanceService';
import { getTopicById } from '../services/topic/TopicService';
import { getBaoCaoTheoDeTai } from '../services/progress/ProgressService';
import type { BaoCaoTienDo } from '../services/progress/ProgressService';

const statusColor: Record<string, string> = {
  'Nháp': 'default',
  'Đang chấm': 'processing',
  'Yêu cầu bổ sung': 'warning',
  'Đã chốt': 'success',
  'Không đạt': 'error',
};

export default function Acceptance() {
  const { maDT } = useParams<{ maDT: string }>();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState<HoSoNghiemThu>();
  const [projectStatus, setProjectStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partialAcceptances, setPartialAcceptances] = useState<BaoCaoTienDo[]>([]);

  const [draftForm] = Form.useForm();
  const [scoreForm] = Form.useForm();
  const [finalForm] = Form.useForm();

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const account = token ? jwtDecode<{ TaiKhoan?: string }>(token).TaiKhoan || '' : '';

  // ----- Load dữ liệu -----
  const load = useCallback(async () => {
    if (!maDT) return;
    try {
      setLoading(true);
      const [dossiers, project] = await Promise.all([
        getAcceptanceByProject(maDT),
        getTopicById(maDT),
      ]);
      setDossier(dossiers[0]);
      setProjectStatus(project.TrangThai);
      const reports = await getBaoCaoTheoDeTai(maDT).catch(() => [] as BaoCaoTienDo[]);
      setPartialAcceptances(reports.filter((report) => report.LoaiBaoCao === 'Nghiệm thu từng phần'));
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không tải được hồ sơ nghiệm thu');
    } finally {
      setLoading(false);
    }
  }, [maDT]);

  useEffect(() => {
    load();
  }, [load]);

  // ----- Tạo & gửi hồ sơ nghiệm thu -----
  const createAndSubmit = async () => {
    if (!maDT) return;
    try {
      const values = await draftForm.validateFields();
      setSaving(true);

      const created = await createAcceptanceDraft(maDT, values.GhiChu);

      await Promise.all(
        files.map((file) =>
          uploadDocument({
            file,
            maDT,
            maHoSoNghiemThu: created.Id,
            loaiTaiLieu: 'Hồ sơ nghiệm thu',
          })
        )
      );

      await submitAcceptance(created.Id);

      message.success('Đã gửi hồ sơ nghiệm thu đến hội đồng');
      setCreating(false);
      setFiles([]);
      await load();
    } catch (error: any) {
      if (!error?.errorFields) {
        message.error(error.response?.data?.message || 'Không thể gửi hồ sơ nghiệm thu');
      }
    } finally {
      setSaving(false);
    }
  };

  // ----- Gửi phiếu chấm -----
  const sendScore = async () => {
    if (!dossier) return;
    try {
      const values = await scoreForm.validateFields();
      setSaving(true);
      await submitAcceptanceScore(dossier.Id, values.Diem, values.NhanXet);
      message.success('Đã gửi phiếu chấm');
      setScoreOpen(false);
      await load();
    } catch (error: any) {
      if (!error?.errorFields) {
        message.error(error.response?.data?.message || 'Không thể gửi phiếu chấm');
      }
    } finally {
      setSaving(false);
    }
  };

  // ----- Chốt kết quả nghiệm thu -----
  const finalize = async () => {
    if (!dossier) return;
    try {
      const values = await finalForm.validateFields();
      setSaving(true);
      await finalizeAcceptance(dossier.Id, values);
      message.success('Đã chốt kết quả nghiệm thu');
      setFinalOpen(false);
      await load();
    } catch (error: any) {
      if (!error?.errorFields) {
        message.error(error.response?.data?.message || 'Không thể chốt kết quả');
      }
    } finally {
      setSaving(false);
    }
  };

  const isSender = dossier?.TaiKhoanNguoiGui === account;
  const myScore = dossier?.PhieuCham?.find((item) => item.TaiKhoanHoiDong === account);

  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: 20 }}>
      <Spin spinning={loading}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 12 }}
        >
          Quay lại
        </Button>

        <Card
          title="Hồ sơ nghiệm thu"
          extra={
            <Tag color={statusColor[dossier?.TrangThai || projectStatus] || 'blue'}>
              {dossier?.TrangThai || projectStatus || '—'}
            </Tag>
          }
        >
          <Tabs defaultActiveKey="final" items={[
            {
              key: 'final',
              label: 'Nghiệm thu toàn bộ',
              children: <>
          {!dossier ? (
            <Empty
              description={
                projectStatus === 'Chờ nghiệm thu'
                  ? 'Đề tài đủ điều kiện nộp hồ sơ nghiệm thu'
                  : 'Chưa có hồ sơ nghiệm thu'
              }
            >
              {projectStatus === 'Chờ nghiệm thu' && (
                <Button
                  type="primary"
                  icon={<FileAddOutlined />}
                  onClick={() => {
                    draftForm.resetFields();
                    setCreating(true);
                  }}
                >
                  Tạo và gửi hồ sơ
                </Button>
              )}
            </Empty>
          ) : (
            <>
              <Descriptions
                column={2}
                bordered
                size="small"
                items={[
                  { key: 'avg', label: 'Điểm trung bình', children: dossier.DiemTrungBinh ?? 'Chưa có' },
                  { key: 'final', label: 'Điểm cuối cùng', children: dossier.DiemCuoiCung ?? 'Chưa chốt' },
                  { key: 'quality', label: 'Chất lượng', children: dossier.ChatLuong || 'Chưa chốt' },
                  { key: 'result', label: 'Kết quả', children: dossier.KetQuaCuoiCung || 'Đang xử lý' },
                ]}
              />

              <div style={{ marginTop: 18 }}>
                <b>Ghi chú hồ sơ:</b>
                <p>{dossier.GhiChu || '—'}</p>
              </div>

              <div style={{ marginTop: 18 }}>
                <b>Tài liệu hồ sơ</b>
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {dossier.TaiLieu?.map((file) => (
                      <Button
                        key={file.MaTL}
                        icon={<DownloadOutlined />}
                        onClick={() => downloadDocument(file.MaTL, file.TenFile)}
                      >
                        {file.TenFile}
                      </Button>
                    )) || 'Chưa có tài liệu'}
                  </Space>
                </div>
              </div>

              {dossier.NhanXetChuTich && (
                <Card size="small" style={{ marginTop: 16, background: '#f6ffed' }}>
                  <b>Kết luận cuối cùng:</b>
                  <br />
                  {dossier.NhanXetChuTich}
                </Card>
              )}

              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <b>Phiếu chấm hội đồng</b>
                </div>
                <div style={{ marginTop: 8 }}>
                  {dossier.PhieuCham?.length ? (
                    dossier.PhieuCham.map((score) => (
                      <Card key={score.Id} size="small" style={{ marginBottom: 8 }}>
                        <b>{score.NguoiHoiDong?.TenDayDu || score.TaiKhoanHoiDong}</b>
                        {!isSender && score.Diem !== undefined && <span> · {score.Diem} điểm</span>}
                        <br />
                        {score.NhanXet || 'Chưa có nhận xét'}
                      </Card>
                    ))
                  ) : (
                    <p>Phiếu chấm sẽ được công bố sau khi Chủ tịch chốt kết quả.</p>
                  )}
                </div>
              </div>

              {!isSender && dossier.TrangThai === 'Đang chấm' && (
                <Space style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    onClick={() => {
                      scoreForm.setFieldsValue({ Diem: myScore?.Diem, NhanXet: myScore?.NhanXet });
                      setScoreOpen(true);
                    }}
                  >
                    {myScore ? 'Sửa phiếu chấm' : 'Chấm điểm'}
                  </Button>
                  <Button
                    onClick={() => {
                      finalForm.resetFields();
                      finalForm.setFieldValue('DiemCuoiCung', dossier.DiemTrungBinh);
                      setFinalOpen(true);
                    }}
                  >
                    Chốt kết quả (Chủ tịch)
                  </Button>
                </Space>
              )}
            </>
          )}
              </>,
            },
            {
              key: 'partial',
              label: `Nghiệm thu từng phần${partialAcceptances.length ? ` (${partialAcceptances.length})` : ''}`,
              children: partialAcceptances.length ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {partialAcceptances.map((report) => (
                    <Card key={report.Id} size="small" style={{ borderColor: '#d9f7be' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                        <div>
                          <b>{report.MocDeTai ? `${report.MocDeTai.ThuTu}. ${report.MocDeTai.TenMoc}` : report.KyBaoCao}</b>
                          <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>Hồ sơ nghiệm thu theo mốc</div>
                        </div>
                        <Tag color={statusColor[report.TrangThai] || 'blue'}>{report.TrangThai}</Tag>
                      </div>
                      <div style={{ marginTop: 12 }}><b>Kết quả thực hiện:</b><p style={{ marginBottom: 0 }}>{report.NoiDungBaoCao}</p></div>
                      {report.NhanXetHoiDong && <Card size="small" style={{ marginTop: 12, background: '#f6ffed' }}><b>Kết luận hội đồng:</b><br />{report.NhanXetHoiDong}</Card>}
                    </Card>
                  ))}
                </Space>
              ) : (
                <Empty description="Chưa có hồ sơ nghiệm thu từng phần" />
              ),
            },
          ]} />
        </Card>

        {/* Modal: tạo & gửi hồ sơ */}
        <Modal
          title="Gửi hồ sơ nghiệm thu"
          open={creating}
          onCancel={() => setCreating(false)}
          onOk={createAndSubmit}
          confirmLoading={saving}
          okText="Gửi hồ sơ"
        >
          <Form form={draftForm} layout="vertical">
            <Form.Item name="GhiChu" label="Ghi chú">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Tài liệu minh chứng" required>
              <Upload
                multiple
                beforeUpload={(file) => {
                  setFiles((items) => [...items, file]);
                  return false;
                }}
                onRemove={(file) =>
                  setFiles((items) =>
                    items.filter((item) => item.name !== file.name || item.size !== file.size)
                  )
                }
              >
                <Button>Chọn tệp</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal: phiếu chấm */}
        <Modal
          title="Phiếu chấm nghiệm thu"
          open={scoreOpen}
          onCancel={() => setScoreOpen(false)}
          onOk={sendScore}
          confirmLoading={saving}
        >
          <Form form={scoreForm} layout="vertical">
            <Form.Item name="Diem" label="Điểm" rules={[{ required: true }]}>
              <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="NhanXet" label="Nhận xét" rules={[{ required: true }]}>
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal: chốt kết quả */}
        <Modal
          title="Chốt kết quả nghiệm thu"
          open={finalOpen}
          onCancel={() => setFinalOpen(false)}
          onOk={finalize}
          confirmLoading={saving}
        >
          <Form form={finalForm} layout="vertical">
            <Form.Item name="DiemCuoiCung" label="Điểm cuối cùng" rules={[{ required: true }]}>
              <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: -16, marginBottom: 16 }}>
              Có thể điều chỉnh trong khoảng 0 – 10 trước khi chốt.
            </div>
            <Form.Item name="ChatLuong" label="Chất lượng" rules={[{ required: true }]}>
              <Input placeholder="Ví dụ: Tốt" />
            </Form.Item>
            <Form.Item name="KetQua" label="Kết quả" rules={[{ required: true }]}>
              <Select
                placeholder="Chọn kết quả"
                options={[
                  { value: 'Đạt', label: 'Đạt' },
                  { value: 'Yêu cầu bổ sung', label: 'Yêu cầu bổ sung' },
                  { value: 'Không đạt', label: 'Không đạt' },
                ]}
              />
            </Form.Item>
            <Form.Item name="NhanXetChuTich" label="Kết luận" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
}

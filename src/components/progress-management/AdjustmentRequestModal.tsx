import { useEffect, useMemo, useState } from 'react';
import { Checkbox, Col, Form, Input, Modal, Row, Select, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TopicLoad, ThanhVienDT } from '../../services/topic/TopicService';
import { getMocTienDoByTopic, type MocTienDo } from '../../services/progress/ProgressService';
import ApiAxios from '../../axios.config';

const { TextArea } = Input;
const { Dragger } = Upload;

type AdjustmentGroup = 'Nội dung nghiên cứu' | 'Thành viên thực hiện' | 'Tiến độ / mốc thực hiện';

interface SpecializationOption {
  idChuyenNganh: string;
  TenChuyenNganh: string;
}

interface FacultyOption {
  idPhanLoai: string;
  TenPhanLoai: string;
}

export interface AdjustmentRequestPayload {
  nhomDieuChinh: string[];
  thongTinHienTai: string;
  noiDungDeNghi: string;
  lyDo: string;
  files: UploadFile[];
}

interface AdjustmentRequestModalProps {
  open: boolean;
  topicCode: string;
  topic: TopicLoad | null;
  members: ThanhVienDT[];
  onClose: () => void;
  onSubmit: (topicCode: string, payload: AdjustmentRequestPayload) => Promise<void>;
}

const formatDate = (value?: Date | string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

export default function AdjustmentRequestModal({ open, topicCode, topic, members, onClose, onSubmit }: AdjustmentRequestModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [group, setGroup] = useState<AdjustmentGroup>();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<MocTienDo[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);

  useEffect(() => {
    if (!open || !topicCode) return;
    void getMocTienDoByTopic(topicCode).then(setMilestones).catch(() => setMilestones([]));
  }, [open, topicCode]);

  useEffect(() => {
    if (!open) return;
    void ApiAxios.get<SpecializationOption[]>('/spec/chuyennganh')
      .then((response) => setSpecializations(response.data))
      .catch(() => setSpecializations([]));
  }, [open]);

  useEffect(() => {
    if (!open || !topic?.ChuyenNganh) return;
    void ApiAxios.get<FacultyOption[]>(`/spec/phanloai/${encodeURIComponent(String(topic.ChuyenNganh))}`)
      .then((response) => setFaculties(response.data))
      .catch(() => setFaculties([]));
  }, [open, topic?.ChuyenNganh]);

  const topicSpecializationId = String(topic?.ChuyenNganh ?? '').trim();
  const topicFacultyId = String(topic?.Khoa ?? '').trim();
  const specializationName = specializations.find((item) => String(item.idChuyenNganh).trim() === topicSpecializationId)?.TenChuyenNganh
    || topic?.ChuyenNganh
    || 'Chưa cập nhật';
  const facultyName = faculties.find((item) => String(item.idPhanLoai).trim() === topicFacultyId)?.TenPhanLoai
    || topic?.Khoa
    || 'Chưa cập nhật';

  const fieldOptions = useMemo(() => {
    if (group === 'Nội dung nghiên cứu') return [
      { value: 'TenDT', label: 'Tên đề tài', current: topic?.TenDT || 'Chưa cập nhật' },
      { value: 'ChuyenNganh', label: 'Chuyên ngành', current: specializationName },
      { value: 'Khoa', label: 'Khoa', current: facultyName },
      { value: 'PhanLoai', label: 'Phân loại', current: topic?.PhanLoai || 'Chưa cập nhật' },
      { value: 'MoTa', label: 'Mô tả / nội dung nghiên cứu', current: topic?.MoTa || 'Chưa cập nhật' },
    ];
    if (group === 'Thành viên thực hiện') return members.map((member) => ({
      value: `TV:${member.TaiKhoan}`,
      label: `${member.NguoiDung?.TenDayDu || member.TaiKhoan} — ${member.VaiTroDT}`,
      current: `Tài khoản: ${member.TaiKhoan}; vai trò: ${member.VaiTroDT}`,
    }));
    if (group === 'Tiến độ / mốc thực hiện') return milestones.map((milestone) => ({
      value: `MOC:${milestone.MaMoc}`,
      label: milestone.TenMoc,
      current: `Mốc “${milestone.TenMoc}”: ${formatDate(milestone.NgayBatDau)} → ${formatDate(milestone.NgayKetThuc)}; trạng thái: ${milestone.TrangThai}`,
    }));
    return [];
  }, [facultyName, group, members, milestones, specializationName, topic]);

  const currentInformation = fieldOptions
    .filter((item) => selectedKeys.includes(item.value))
    .map((item) => `${item.label}: ${item.current}`)
    .join('\n');

  useEffect(() => {
    form.setFieldValue('thongTinHienTai', currentInformation);
  }, [currentInformation, form]);

  const resetForm = () => {
    form.resetFields();
    setGroup(undefined);
    setSelectedKeys([]);
    setFiles([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!group || !selectedKeys.length) return;
      setSubmitting(true);
      const selectedFields = fieldOptions.filter((item) => selectedKeys.includes(item.value));
      const proposedInformation = selectedFields
        .map((item) => `${item.label}: ${values.deNghi?.[item.value]?.trim() || ''}`)
        .join('\n');
      await onSubmit(topicCode, {
        nhomDieuChinh: selectedFields.map((item) => `${group}: ${item.label}`),
        thongTinHienTai: currentInformation,
        noiDungDeNghi: proposedInformation,
        lyDo: values.lyDo,
        files,
      });
      message.success('Đã gửi phiếu điều chỉnh, chờ admin phê duyệt');
      resetForm();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error('Gửi phiếu điều chỉnh thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Tạo phiếu điều chỉnh đề tài" open={open} onCancel={() => { resetForm(); onClose(); }} onOk={handleSubmit} confirmLoading={submitting} okText="Gửi cho admin duyệt" cancelText="Hủy" width={650}>
      <Form form={form} layout="vertical">
        <Form.Item label="Nhóm nội dung điều chỉnh" required>
          <Select
            placeholder="Chọn một nhóm điều chỉnh"
            value={group}
            onChange={(value: AdjustmentGroup) => { setGroup(value); setSelectedKeys([]); }}
            options={[
              { value: 'Nội dung nghiên cứu', label: 'Nội dung nghiên cứu' },
              { value: 'Thành viên thực hiện', label: 'Thành viên thực hiện' },
              { value: 'Tiến độ / mốc thực hiện', label: 'Tiến độ / mốc thực hiện' },
            ]}
          />
        </Form.Item>
        {group && <Form.Item label="Thuộc tính cần điều chỉnh" required>
          <Checkbox.Group value={selectedKeys} onChange={(values) => setSelectedKeys(values as string[])} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px 16px' }}>
            {fieldOptions.map((item) => <Checkbox key={item.value} value={item.value}>{item.label}</Checkbox>)}
          </Checkbox.Group>
        </Form.Item>}
        {group && selectedKeys.length > 0 && <Row gutter={16}>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Thông tin hiện tại</div>
            {fieldOptions.filter((item) => selectedKeys.includes(item.value)).map((item) => (
              <div key={item.value} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>{item.label}</div>
                <Input.TextArea value={item.current} readOnly autoSize={{ minRows: 2, maxRows: 4 }} />
              </div>
            ))}
          </Col>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Nội dung đề nghị điều chỉnh</div>
            {fieldOptions.filter((item) => selectedKeys.includes(item.value)).map((item) => (
              <Form.Item key={item.value} name={['deNghi', item.value]} label={item.label} rules={[{ required: true, whitespace: true, message: `Nhập ${item.label.toLowerCase()} đề nghị` }]}>
                {item.value === 'MoTa' ? <TextArea rows={3} placeholder={`Nhập ${item.label.toLowerCase()} mới`} /> : <Input placeholder={`Nhập ${item.label.toLowerCase()} mới`} />}
              </Form.Item>
            ))}
          </Col>
        </Row>}
        <Form.Item name="lyDo" label="Lý do điều chỉnh" rules={[{ required: true, whitespace: true, message: 'Nêu rõ lý do điều chỉnh' }]}>
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Tài liệu đính kèm">
          <Dragger multiple fileList={files} beforeUpload={() => false} onChange={({ fileList }) => setFiles(fileList)}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Kéo thả hoặc bấm để chọn tài liệu</p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
}

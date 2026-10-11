import { useEffect, useMemo, useState } from 'react';
import { Col, Form, Input, Modal, Row, Select, Upload, message, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TopicLoad, ThanhVienDT } from '../../services/topic/TopicService';
import ApiAxios from '../../axios.config';
import RichTextEditor from '../common/RichTextEditor';
import DOMPurify from 'dompurify';
import debounce from 'lodash/debounce';

const { TextArea } = Input;
const { Dragger } = Upload;

type AdjustmentGroup = 'Nội dung nghiên cứu' | 'Thành viên thực hiện';

interface SpecializationOption {
  idChuyenNganh: string;
  TenChuyenNganh: string;
}

interface FacultyOption {
  idPhanLoai: string;
  TenPhanLoai: string;
}

interface AdvisorOption {
  value: string;
  label: string;
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

export default function AdjustmentRequestModal({ open, topicCode, topic, members, onClose, onSubmit }: AdjustmentRequestModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [group, setGroup] = useState<AdjustmentGroup>();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [proposedFaculties, setProposedFaculties] = useState<FacultyOption[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<{ label: string; value: string }[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  useEffect(() => {
    if (!open) return;
    void ApiAxios.get<SpecializationOption[]>('/spec/chuyennganh')
      .then((response) => setSpecializations(response.data))
      .catch(() => setSpecializations([]));

    fetchAdvisors();
  }, [open]);

  const fetchAdvisors = (keyword?: string) => {
    ApiAxios.get<AdvisorOption[]>('/spec/teacher', {
      params: { search: keyword },
    })
      .then((res) => setAdvisors(res.data))
      .catch(() => setAdvisors([]));
  };

  useEffect(() => {
    if (!open || !topic?.ChuyenNganh) return;
    void ApiAxios.get<FacultyOption[]>(`/spec/phanloai/${encodeURIComponent(String(topic.ChuyenNganh))}`)
      .then((response) => setFaculties(response.data))
      .catch(() => setFaculties([]));
  }, [open, topic?.ChuyenNganh]);

  const handleProposedChuyenNganhChange = async (value: string) => {
    form.setFieldValue(['deNghi', 'Khoa'], undefined);
    try {
      const [facRes, advRes] = await Promise.all([
        ApiAxios.get<FacultyOption[]>(`/spec/phanloai/${encodeURIComponent(value)}`),
        ApiAxios.get<AdvisorOption[]>(`/spec/teacherCN/${encodeURIComponent(value)}`),
      ]);
      setProposedFaculties(facRes.data);
      if (Array.isArray(advRes.data) && advRes.data.length > 0) {
        setAdvisors(advRes.data);
      }
    } catch {
      setProposedFaculties([]);
    }
  };

  const searchStudents = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value?.trim()) {
          setStudentOptions([]);
          return;
        }
        setFetchingStudents(true);
        try {
          const res = await ApiAxios.get('/user/students', { params: { keyword: value.trim() } });
          const data = Array.isArray(res.data) ? res.data : [];
          setStudentOptions(
            data.map((u: any) => ({
              label: `${u.TaiKhoan}${u.TenDayDu ? ` — ${u.TenDayDu}` : ''}`,
              value: u.TaiKhoan,
            }))
          );
        } catch {
          message.error('Không tìm thấy sinh viên, vui lòng kiểm tra lại!');
        } finally {
          setFetchingStudents(false);
        }
      }, 400),
    []
  );

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
    if (group === 'Thành viên thực hiện') return [
      ...members.map((member) => ({
        value: `TV:${member.TaiKhoan}`,
        label: `${member.NguoiDung?.TenDayDu || member.TaiKhoan} — ${member.VaiTroDT}`,
        current: `Tài khoản: ${member.TaiKhoan}; vai trò: ${member.VaiTroDT}`,
      })),
      {
        value: 'NguoiHD',
        label: 'Giảng viên hướng dẫn',
        current: topic?.NguoiHD?.NguoiDung?.TenDayDu || 'Chưa cập nhật',
      },
    ];
    return [];
  }, [facultyName, group, members, specializationName, topic]);

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
    setProposedFaculties([]);
    setStudentOptions([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!group || !selectedKeys.length) return;
      setSubmitting(true);
      const selectedFields = fieldOptions.filter((item) => selectedKeys.includes(item.value));
      const proposedInformation = selectedFields
        .map((item) => {
          const val = values.deNghi?.[item.value];
          let displayVal = val;
          if (item.value === 'ChuyenNganh') {
            const spec = specializations.find((s) => String(s.idChuyenNganh) === String(val));
            displayVal = spec ? spec.TenChuyenNganh : val;
          } else if (item.value === 'Khoa') {
            const allFacs = proposedFaculties.length > 0 ? proposedFaculties : faculties;
            const fac = allFacs.find((f) => String(f.idPhanLoai) === String(val));
            displayVal = fac ? fac.TenPhanLoai : val;
          } else if (item.value === 'NguoiHD') {
            const adv = advisors.find((a) => String(a.value) === String(val));
            displayVal = adv ? adv.label : val;
          } else if (item.value.startsWith('TV:')) {
            const stu = studentOptions.find((s) => String(s.value) === String(val));
            displayVal = stu ? stu.label : val;
          }
          return `${item.label}: ${typeof displayVal === 'string' ? displayVal.trim() : (displayVal || '')}`;
        })
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

  const renderProposedInput = (item: { value: string; label: string }) => {
    if (item.value === 'MoTa') {
      return <RichTextEditor placeholder={`Nhập ${item.label.toLowerCase()} mới`} minHeight={200} />;
    }

    if (item.value === 'ChuyenNganh') {
      return (
        <Select
          showSearch
          placeholder="Chọn chuyên ngành"
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          onChange={(val) => {
            form.setFieldValue(['deNghi', 'ChuyenNganh'], val);
            void handleProposedChuyenNganhChange(val);
          }}
          options={[...specializations]
            .sort((a, b) => a.TenChuyenNganh.localeCompare(b.TenChuyenNganh, 'vi'))
            .map((s) => ({
              value: s.idChuyenNganh,
              label: s.TenChuyenNganh,
            }))}
        />
      );
    }

    if (item.value === 'Khoa') {
      const activeFaculties = proposedFaculties.length > 0 ? proposedFaculties : faculties;
      return (
        <Select
          showSearch
          placeholder="Chọn khoa"
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={activeFaculties.map((f) => ({
            value: f.idPhanLoai,
            label: f.TenPhanLoai,
          }))}
        />
      );
    }

    if (item.value === 'NguoiHD') {
      return (
        <Select
          showSearch
          placeholder="Chọn giảng viên hướng dẫn"
          options={advisors}
          filterOption={false}
          onSearch={fetchAdvisors}
        />
      );
    }

    if (item.value.startsWith('TV:')) {
      return (
        <Select
          showSearch
          placeholder="Tìm kiếm và chọn sinh viên thay thế"
          options={studentOptions}
          filterOption={false}
          onSearch={searchStudents}
          loading={fetchingStudents}
          notFoundContent={fetchingStudents ? <Spin size="small" /> : 'Nhập mã SV hoặc tên để tìm kiếm'}
        />
      );
    }

    return <Input placeholder={`Nhập ${item.label.toLowerCase()} mới`} />;
  };

  return (
    <Modal title="Tạo phiếu điều chỉnh đề tài" open={open} onCancel={() => { resetForm(); onClose(); }} onOk={handleSubmit} confirmLoading={submitting} okText="Gửi cho admin duyệt" cancelText="Hủy" width={650}>
      <Form form={form} layout="vertical">
        <Form.Item label="Nhóm nội dung điều chỉnh" required>
          <Select
            placeholder="Chọn một nhóm điều chỉnh"
            value={group}
            onChange={(value: AdjustmentGroup) => {
              setGroup(value);
              setSelectedKeys([]);
              form.setFieldValue('deNghi', {});
            }}
            options={[
              { value: 'Nội dung nghiên cứu', label: 'Nội dung nghiên cứu' },
              { value: 'Thành viên thực hiện', label: 'Thành viên thực hiện' },
            ]}
          />
        </Form.Item>
        {group && (
          <Form.Item label="Thuộc tính cần điều chỉnh" required>
            <Select
              mode="multiple"
              placeholder="Chọn các thuộc tính cần điều chỉnh"
              value={selectedKeys}
              onChange={(values) => setSelectedKeys(values)}
              options={fieldOptions.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              style={{ width: '100%' }}
              allowClear
            />
          </Form.Item>
        )}
        {group && selectedKeys.length > 0 && <Row gutter={16}>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Thông tin hiện tại</div>
            {fieldOptions.filter((item) => selectedKeys.includes(item.value)).map((item) => (
              <div key={item.value} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>{item.label}</div>
                {item.value === 'MoTa' ? (
                  <div
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 6,
                      padding: '8px 11px',
                      minHeight: 64,
                      maxHeight: 160,
                      overflowY: 'auto',
                      background: '#fafafa',
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.current) }}
                  />
                ) : (
                  <Input.TextArea value={item.current} readOnly autoSize={{ minRows: 2, maxRows: 4 }} />
                )}
              </div>
            ))}
          </Col>
          <Col span={12}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Nội dung đề nghị điều chỉnh</div>
            {fieldOptions.filter((item) => selectedKeys.includes(item.value)).map((item) => (
              <Form.Item
                key={item.value}
                name={['deNghi', item.value]}
                label={item.label}
                rules={
                  item.value === 'MoTa'
                    ? [{
                      validator: (_, value) =>
                        !value || !String(value).replace(/<(.|\n)*?>/g, '').trim()
                          ? Promise.reject(new Error(`Nhập ${item.label.toLowerCase()} đề nghị`))
                          : Promise.resolve(),
                    }]
                    : [{ required: true, whitespace: typeof item.value === 'string' && !item.value.startsWith('TV:') && item.value !== 'ChuyenNganh' && item.value !== 'Khoa' && item.value !== 'NguoiHD', message: `Chọn hoặc nhập ${item.label.toLowerCase()} đề nghị` }]
                }
              >
                {renderProposedInput(item)}
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

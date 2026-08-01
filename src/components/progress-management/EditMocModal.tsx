import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Row, Col, Button, Upload, Divider, Space, Tag } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { MocTienDo, ThanhVienMocDT } from '../../services/progress/ProgressService';

const { TextArea } = Input;

interface EditMocModalProps {
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  selectedMoc: MocTienDo | null;
  canManageMoc: boolean;
  memberOptions: { label: string; value: number }[];
  loadingMembers: boolean;
  milestoneMembers: ThanhVienMocDT[];
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onFinish: (values: any) => void;
}

/**
 * Modal sửa thông tin mốc tiến độ và cập nhật tiến độ / file minh chứng.
 */
const EditMocModal: React.FC<EditMocModalProps> = ({
  open, onCancel, form, selectedMoc, canManageMoc, memberOptions,
  loadingMembers, milestoneMembers, selectedFile, setSelectedFile, onFinish,
}) => {
  return (
    <Modal
      title={`Sửa / Cập nhật mốc: ${selectedMoc?.TenMoc}`}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
          <Input disabled={!canManageMoc} />
        </Form.Item>
        <Form.Item name="MoTa" label="Mô tả">
          <TextArea disabled={!canManageMoc} />
        </Form.Item>
        <Form.Item
          label="Thành viên"
          name="ThanhVienIds"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 thành viên' }]}
        >
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder="Nhập tên tài khoản để thêm thành viên"
            disabled={!canManageMoc || loadingMembers}
            filterOption={(input, option) =>
              String(option?.label).toLowerCase().includes(input.toLowerCase())
            }
            options={memberOptions}
            optionFilterProp="label"
          />
        </Form.Item>
        {milestoneMembers.length > 0 && (
          <Form.Item label="Thành viên đang được phân công">
            <Space wrap>
              {milestoneMembers.map((item) => (
                <Tag key={item.Id}>
                  {item.thanhVien.NguoiDung.TenDayDu} — {item.thanhVien.VaiTroDT}
                </Tag>
              ))}
            </Space>
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
              <DatePicker disabled={!canManageMoc} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
              <DatePicker disabled={!canManageMoc} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
              <InputNumber min={1} disabled={!canManageMoc} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} disabled={!canManageMoc} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="GhiChu" label="Ghi chú">
          <TextArea />
        </Form.Item>
        <Divider />

        <Form.Item name="TepDinhKem" label="File minh chứng">
          <Upload
            beforeUpload={(file) => { setSelectedFile(file); return false; }}
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
          {selectedFile && <div style={{ marginTop: 8, fontSize: 12 }}>Đã chọn: {selectedFile.name}</div>}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Lưu</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditMocModal;

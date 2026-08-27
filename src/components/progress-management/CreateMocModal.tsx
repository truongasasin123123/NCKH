import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Row, Col, Button } from 'antd';
import type { FormInstance } from 'antd';

const { TextArea } = Input;

interface CreateMocModalProps {
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  memberOptions: { label: string; value: number }[];
  onFinish: (values: any) => void;
  onReset: () => void;
  nextThuTu: number;
}

const CreateMocModal: React.FC<CreateMocModalProps> = ({
  open, onCancel, form, memberOptions, onFinish, onReset, nextThuTu,
}) => {
  useEffect(() => {
    if (open) {
      form.setFieldValue('ThuTu', nextThuTu);
    }
  }, [open, nextThuTu, form]);

  return (
    <Modal
      title="Tạo mốc tiến độ"
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
          <Input allowClear placeholder="Nhập tên mốc" />
        </Form.Item>

        <Form.Item name="MoTa" label="Mô tả">
          <TextArea allowClear placeholder="Nhập mô tả" rows={3} />
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
            filterOption={(input, option) =>
              String(option?.label).toLowerCase().includes(input.toLowerCase())
            }
            options={memberOptions}
            optionFilterProp="label"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} allowClear />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="GhiChu" label="Ghi chú">
          <TextArea allowClear placeholder="Nhập ghi chú" rows={3} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20 }}>
            <Button type="primary" htmlType="submit">
              Tạo
            </Button>

            <Button style={{ color: 'white' }} onClick={onReset} className="btn-delete">
              Xóa
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateMocModal;
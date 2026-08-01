import type { FormInstance } from 'antd';
import { Button, Card, Col, Form, Input, Row } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';

interface TopicEditFormProps {
  form: FormInstance;
  onSubmit: (values: unknown) => void;
  onCancel: () => void;
}

export default function TopicEditForm({ form, onSubmit, onCancel }: TopicEditFormProps) {
  return (
    <Form form={form} onFinish={onSubmit} layout="vertical">
      <Row gutter={[16, 16]} align="top">
        <Col xs={24} md={12}>
          <Card title="Thông tin cơ bản">
            <Form.Item label="Tên đề tài" name="TenDT" rules={[{ required: true, message: 'Vui lòng nhập tên đề tài' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Danh mục" name="PhanLoai" rules={[{ required: true, message: 'Vui lòng nhập danh mục' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Ngày bắt đầu" name="NgayBatDau"><Input type="date" disabled /></Form.Item>
            <Form.Item label="Hạn chót" name="NgayKetThuc"><Input type="date" disabled /></Form.Item>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Trạng thái" style={{ height: 'fit-content' }}>
            <Form.Item label="Trạng thái" name="TrangThai"><Input disabled /></Form.Item>
          </Card>
        </Col>
      </Row>

      <Card title="Mô tả" style={{ marginTop: 16 }}>
        <Form.Item label="Mô tả" name="MoTa"><Input.TextArea rows={3} /></Form.Item>
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col><Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Lưu thay đổi</Button></Col>
        <Col><Button danger icon={<CloseOutlined />} onClick={onCancel}>Hủy</Button></Col>
      </Row>
    </Form>
  );
}

import { Form, Input, Select, Button, message, Card, Typography } from "antd";

import { createAccount } from "../Quản lý thông tin đề án/AccountService";

const { Option } = Select;
const { Title } = Typography;

const ROLE_OPTIONS = [
  { value: "sinhvien", label: "Sinh viên" },
  { value: "giangvien", label: "Giảng viên" },
  { value: "nguoihuongdan", label: "Người hướng dẫn" },
  { value: "trolykhoahoc", label: "Trợ lý khoa học" },
  { value: "bankhcn", label: "Ban KH&CN" },
  { value: "taichinh", label: "Tài chính" },
  { value: "quantri", label: "Admin" },
];

const CreateAccount: React.FC = () => {
  const [form] = Form.useForm();
  

  const generatePassword = () => {
    const pwd = Math.random().toString(36).slice(-8);
    form.setFieldValue("MatKhau", pwd);
  };

  const handleSubmit = async (values: any) => {
    try {
      await createAccount({
        TaiKhoan: values.TaiKhoan,
        MatKhau: values.MatKhau,
        VaiTro: values.VaiTro,
        Gmail: values.Gmail || null,
        TrangThaiTaiKhoan: "Hoạt động",
        BatBuocDoiMatKhau: true,
      });
      message.success("Tạo tài khoản thành công");
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Tạo tài khoản thất bại");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <Card>
        <Title level={4}>Tạo tài khoản mới</Title>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tài khoản"
            name="TaiKhoan"
            rules={[{ required: true, message: "Nhập tài khoản" }]}
          >
            <Input placeholder="vd: sv001, gv001..." />
          </Form.Item>

          <Form.Item
            label="Mật khẩu ban đầu"
            name="MatKhau"
            rules={[
              { required: true, message: "Nhập mật khẩu" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password
              addonAfter={
                <span style={{ cursor: "pointer" }} onClick={generatePassword}>
                  Tạo tự động
                </span>
              }
            />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="VaiTro"
            rules={[{ required: true, message: "Chọn vai trò" }]}
          >
            <Select placeholder="Chọn vai trò">
              {ROLE_OPTIONS.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Gmail (không bắt buộc)"
            name="Gmail"
            rules={[{ type: "email", message: "Sai định dạng email" }]}
          >
            <Input placeholder="Dùng để gửi thông báo" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            
            <Button type="primary" htmlType="submit">
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateAccount;
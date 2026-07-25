import { Form, Input, Select, DatePicker, Button, message, Card, Typography, Row, Col, InputNumber } from "antd";
import { useNavigate } from "react-router-dom";
import { createCouncil } from "../ThongTinDeTai/CouncilService";

const { Title } = Typography;
const { Option } = Select;

const CreateCouncilPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      await createCouncil({
        TenHoiDong: values.TenHoiDong,
        LoaiHoiDong: values.LoaiHoiDong,


      });
      message.success("Tạo hội đồng thành công");
      navigate(-1);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Tạo hội đồng thất bại");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <Card>
        <Title level={4}>Tạo hội đồng mới</Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên hội đồng"
            name="TenHoiDong"
            rules={[{ required: true, message: "Nhập tên hội đồng" }]}
          >
            <Input placeholder="vd: Hội đồng nghiệm thu đề tài 2026" />
          </Form.Item>

          <Form.Item
            label="Loại hội đồng"
            name="LoaiHoiDong"
            rules={[{ required: true, message: "Chọn loại hội đồng" }]}
          >
            <Select placeholder="Chọn loại hội đồng">
              <Option value="DanhGia">Hội đồng đánh giá</Option>
              <Option value="NghiemThu">Hội đồng nghiệm thu</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày thành lập"
            name="NgayThanhLap"
            rules={[{ required: true, message: "Chọn ngày thành lập" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button onClick={() => navigate(-1)} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Tạo hội đồng
            </Button>
          </Form.Item>

          <Form.Item label="Năm hoạt động" required>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="NamBatDau"
                  noStyle
                  rules={[{ required: true, message: "Nhập năm bắt đầu" }]}
                  initialValue={new Date().getFullYear()}
                >
                  <InputNumber style={{ width: "100%" }} min={2000} max={2100} placeholder="Từ năm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="NamKetThuc"
                  noStyle
                  rules={[
                    { required: true, message: "Nhập năm kết thúc" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || value >= getFieldValue("NamBatDau")) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("Năm kết thúc phải ≥ năm bắt đầu"));
                      },
                    }),
                  ]}
                  initialValue={new Date().getFullYear() + 1}
                >
                  <InputNumber style={{ width: "100%" }} min={2000} max={2100} placeholder="Đến năm" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateCouncilPage;
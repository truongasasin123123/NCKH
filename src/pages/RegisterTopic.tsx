import { Card, Form, Input, Select, Button, Row, Col, Space, Typography, Upload, message, } from "antd";
import debounce from "lodash/debounce";
import { UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import ApiAxios from "../axios.config";
import type { UploadFile } from 'antd/es/upload/interface';
import { uploadDocument } from './ThongTinDeTai/DocumentsService';

const { Title } = Typography;
const { TextArea } = Input;

interface JwtPayload {
  VaiTro?: string;
}

interface ChuyenNganh {
  idChuyenNganh: string;
  TenChuyenNganh: string;
  TenPhanLoai: string;
  idPhanLoai: string;
}

interface NguoiHDOption {
  value: string;
  label: string;
}

export interface RegisterTopic {
  MaDT: string;
  TenDT: string;
  ChuyenNganh: string;
  Khoa: string;
  PhanLoai: string;
  idNguoiHD: string;
  ThanhVienIds: string[];
  MoTa?: string;
  taiLieu?: UploadFile[];
}

const RegisterTopic = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [options, setOptions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [chuyenNganh, setChuyenNganh] = useState<ChuyenNganh[]>([]);
  const [nguoiHuongDan, setNguoiHuongDan] = useState<NguoiHDOption[]>([]);
  const [phanLoai, setPhanLoai] = useState<ChuyenNganh[]>([]);

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const displayRole = user?.VaiTro || null;
  const isCommitteeRole = displayRole?.toLowerCase().includes('hội đồng') || displayRole?.toLowerCase().includes('hoidong');

  useEffect(() => {
    if (isCommitteeRole) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/mainhome');
      return;
    }

    // Tiếp tục logic bình thường nếu không phải hội đồng
    ApiAxios.get("/spec/chuyennganh")
      .then(res => setChuyenNganh(res.data))
      .catch(err => console.log(err));

    fetchTeacher();
  }, [isCommitteeRole, navigate]);

  const onFinish = async (values: RegisterTopic) => {
    try {

      const { taiLieu = [], ...payload } = values;

      await ApiAxios.post("/project/registerproject", payload);

      await Promise.all(
        taiLieu.map((uploadFile) => {
          if (!uploadFile.originFileObj) {
            throw new Error(`Không đọc được file ${uploadFile.name}`);
          }
          return uploadDocument({
            file: uploadFile.originFileObj,
            maDT: values.MaDT,
            loaiTaiLieu: 'Tài liệu đăng ký đề tài',
          });
        }),
      );

      message.success('Đã tạo đề tài ở trạng thái Nháp. Bạn có thể sửa hoặc xóa trước khi gửi Hội đồng xét duyệt.');
      form.resetFields();

    } catch (error: any) {
      message.error(error?.response?.data?.message || "Đăng ký thất bại");
    }
  };

  //Ham tim thanh vien
  const searchUser = debounce(async (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }

    setFetching(true);
    try {
      const takename = await ApiAxios.get(`/user/sreach?userkey=${value}`);
      const data = Array.isArray(takename.data) ? takename.data : [];
      setOptions(
        data.map((u: any) => ({
          label: u.TaiKhoan, value: u.TaiKhoan,
        }))
      );
    } catch {
      message.error("Không tìm thấy tên người dùng vui lòng kiểm tra lại!");
    } finally {
      setFetching(false);
    }
  }, 400);

  const handleSearch = (value: string) => {
    searchUser(value);
  };

  const requiredRule = (label: string) => ({
    required: true,
    message: `Vui lòng nhập ${label}`
  });

  const requiredRuleDrop = (labelDrop: string) => ({
    required: true,
    message: `Vui lòng chọn ${labelDrop}`
  });

  const handleChuyenNganhchange = async (value: string) => {
    const res = await ApiAxios.get(`/spec/phanloai/${value}`);
    const NguoiHDres = await ApiAxios.get(`/spec/teacherCN/${value}`);
    setPhanLoai(res.data);
    setNguoiHuongDan(NguoiHDres.data);
  };

  //ham loc chuyen nganh
  useEffect(() => {
    ApiAxios.get("/spec/chuyennganh")
      .then(res => setChuyenNganh(res.data))
      .catch(err => console.log(err));
  }, []);

  //ham loc nguoi huong dan
  const fetchTeacher = (keyword?: string) => {
    ApiAxios.get<NguoiHDOption[]>("/spec/teacher", {
      params: { search: keyword },
    }).then(res => setNguoiHuongDan(res.data));
  };

  useEffect(() => {
    fetchTeacher();
  }, []);

  return (
    <Card
      style={{
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        borderRadius: 12,
        marginTop: 20
      }}
    >
      <Title level={2} style={{ marginBottom: 30, textAlign: "center", textTransform: "uppercase" }}>Đăng ký đề tài</Title>

      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        {/* Hàng 1 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã đề tài:"
              name="MaDT"
              rules={[requiredRule("mã đề tài")]}
            >
              <Input placeholder="Nhập mã đề tài" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Tên đề tài:"
              name="TenDT"
              rules={[requiredRule("tên đề tài")]}
            >
              <Input placeholder="Nhập tên đề tài" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Chuyên Ngành:"
              name="ChuyenNganh"
              rules={[requiredRuleDrop("Chuyên ngành")]}
            >
              <Select
                showSearch
                placeholder="Chọn chuyên ngành"
                onChange={handleChuyenNganhchange}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={[...chuyenNganh]
                  .sort((a, b) => a.TenChuyenNganh.localeCompare(b.TenChuyenNganh, 'vi'))
                  .map(item => ({
                    value: item.idChuyenNganh,
                    label: item.TenChuyenNganh
                  }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Khoa:"
              name="Khoa"
              rules={[requiredRuleDrop("khoa")]}
            >
              <Select
                placeholder="Chọn khoa"
                options={phanLoai.map(item => ({
                  value: item.idPhanLoai,
                  label: item.TenPhanLoai
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Phân loại */}
        <Form.Item
          label="Phân loại đề tài:"
          name="PhanLoai"
          rules={[requiredRule("loại đề tài")]}
        >
          <Input placeholder="Nhập loại đề tài" />
        </Form.Item>

        {/* Người hướng dẫn */}
        <Form.Item
          label="Người hướng dẫn:"
          name="idNguoiHD"
          rules={[requiredRuleDrop("người hướng dẫn")]}
        >
          <Select
            showSearch
            placeholder="Chọn người hướng dẫn"
            options={nguoiHuongDan}
            filterOption={false}
            onSearch={fetchTeacher}
          />

        </Form.Item>

        <Form.Item
          label="Thành viên"
          name="ThanhVienIds"
          rules={[
            { required: true, message: "Vui lòng chọn ít nhất 1 thành viên" }
          ]}
        >
          <Select
            mode="multiple"
            showSearch
            placeholder="Nhập tên tài khoản để thêm thành viên ( người đăng kí mặc định là nhóm trưởng )"
            onSearch={handleSearch}
            filterOption={false}
            notFoundContent={fetching ? "Đang tìm..." : "Không có kết quả"}
            options={options}
            optionFilterProp="label"
          />
        </Form.Item>


        {/* Mô tả */}
        <Form.Item label="Mô tả đề tài:" name="MoTa">
          <TextArea rows={6} />
        </Form.Item>

        {/* Đính kèm tài liệu */}
        <Form.Item
          label="Đính kèm tài liệu"
          name="taiLieu"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
        >
          <Upload
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.pptx"
            maxCount={5}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>
              Chọn tài liệu
            </Button>
          </Upload>
        </Form.Item>

        {/* Nút */}
        <Form.Item style={{ textAlign: "center" }}>
          <Space size="large">
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "120px", height: "40px", fontSize: "16px" }}
            >
              Gửi
            </Button>
            <Button
              danger
              onClick={() => form.resetFields()}
              style={{ width: "120px", height: "40px", fontSize: "16px" }}
            >
              Hủy
            </Button>

          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default RegisterTopic;

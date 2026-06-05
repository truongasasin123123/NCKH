import { Form, Input, Button, message, Card, Row, Col, Avatar, Upload, Modal } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, UploadOutlined } from "@ant-design/icons";
import { useState, useEffect, } from "react";
import { jwtDecode } from 'jwt-decode';
import ApiAxios from "../axios.config";

interface UserProfile {
  TaiKhoan: string;
  TenDayDu: string;
  VaiTro?: string;
  Gmail?: string;
  SDT?: string;
  AvatarUrl?: string;
  role?: string;
}

interface JwtPayload {
  VaiTro?: string;
  role?: string;
}

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const decodedUser: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await ApiAxios.get(`/auth/profile`);
      const data = response.data as UserProfile;
      const profileData: UserProfile = {
        ...data,
        VaiTro: data.VaiTro || data.role || decodedUser?.VaiTro || decodedUser?.role,
      };

      setUserProfile(profileData);
      setAvatarUrl(data.AvatarUrl);
      form.setFieldsValue(profileData);
    } catch (error: any) {
      message.error("Không thể lấy thông tin người dùng");
    }
  };

  const onFinish = async (values: UserProfile) => {
    try {
      setLoading(true);
      const profileToSave = {
        ...values,
        AvatarUrl: avatarUrl,
        VaiTro: userProfile?.VaiTro || values.VaiTro,
      };
      await ApiAxios.put(`/auth/profile`, profileToSave);
      message.success("Cập nhật thông tin thành công!");
      setEditing(false);
      setUserProfile(profileToSave);
      form.setFieldsValue(profileToSave);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const confirmSave = (values: UserProfile) => {
    Modal.confirm({
      title: "Xác nhận cập nhật",
      content: "Bạn có chắc chắn muốn lưu các thay đổi này không?",
      okText: "Có",
      cancelText: "Không",
      onOk: () => onFinish(values),
    });
  };

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      form.setFieldsValue({ AvatarUrl: result });
    };
    reader.readAsDataURL(file);
    return false; // chặn upload thực tế
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    form.setFieldsValue(userProfile);
  };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
      {userProfile && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar size={64} src={avatarUrl} icon={!avatarUrl ? <UserOutlined /> : undefined} />
                  <div>
                    <h1 style={{ margin: '0 0 8px 0' }}>{userProfile.TenDayDu}</h1>
                    <p style={{ margin: 0, color: '#666' }}>@{userProfile.TaiKhoan}</p>
                  </div>
                </div>
                {editing && (
                  <div style={{ marginTop: 12 }}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                    >
                      <Button icon={<UploadOutlined />}>Tải ảnh đại diện</Button>
                    </Upload>
                  </div>
                )}
              </Col>
              <Col xs={24} md={6}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!editing ? (
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      block
                      onClick={handleEdit}
                    >
                      Chỉnh sửa thông tin
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        block
                        loading={loading}
                        onClick={() => form.submit()}
                      >
                        Lưu thay đổi
                      </Button>
                      <Button
                        danger
                        icon={<CloseOutlined />}
                        block
                        onClick={handleCancel}
                      >
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          <Form
            id="profile-form"
            form={form}
            layout="vertical"
            onFinish={confirmSave}
            initialValues={userProfile || {}}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="Thông tin cơ bản">
                  <Form.Item
                    label="Tài khoản"
                    name="TaiKhoan"
                  >
                    <Input disabled />
                  </Form.Item>

                  <Form.Item
                    label="Tên đầy đủ"
                    name="TenDayDu"
                    rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ" }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>

                  <Form.Item
                    label="Vai trò"
                    name="VaiTro"
                  >
                    <Input disabled />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Thông tin liên hệ">
                  <Form.Item
                    label="Gmail"
                    name="Gmail"
                    rules={[
                      { type: "email", message: "Gmail không hợp lệ" },
                      { required: true, message: "Vui lòng nhập email" }
                    ]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>

                  <Form.Item
                    label="Số điện thoại"
                    name="SDT"
                    rules={[
                      { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" }
                    ]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        </>
      )}
    </div>
  );
}

export default Profile;
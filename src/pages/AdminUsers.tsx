import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import { LockOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import ApiAxios from '../axios.config';

interface UserItem {
  TaiKhoan: string;
  TenDayDu?: string;
  Gmail: string;
  SDT?: number;
  VaiTro?: string;
}

interface JwtPayload {
  VaiTro?: string;
}

const roles = [
  'Sinh viên',
  'Giảng viên',
  'Người hướng dẫn',
  'Trợ lý khoa học',
  'Ban KH&CN',
  'Tài chính',
  'Admin',
  'Hội đồng xét duyệt',
  'Hội đồng chấm điểm',
];

const isAdmin = (role?: string) => {
  const normalized = (role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();
  return normalized === 'admin' || normalized === 'quan tri';
};

const AdminUsers = () => {
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const currentUser = token ? jwtDecode<JwtPayload>(token) : null;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiAxios.get('/admin/users', {
        params: { keyword: keyword || undefined, role, page: 1, limit: 100 },
      });
      setData(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin(currentUser?.VaiTro)) loadUsers();
  }, []);

  const createUser = async (values: any) => {
    try {
      await ApiAxios.post('/admin/users', values);
      message.success('Đã tạo tài khoản');
      setCreateOpen(false);
      createForm.resetFields();
      loadUsers();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tạo tài khoản');
    }
  };

  const updateUser = async (values: any) => {
    if (!editingUser) return;
    try {
      await ApiAxios.patch(`/admin/users/${editingUser.TaiKhoan}`, values);
      message.success('Đã cập nhật tài khoản');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể cập nhật tài khoản');
    }
  };

  const resetPassword = async (values: { MatKhau: string }) => {
    if (!resettingUser) return;
    try {
      await ApiAxios.post(`/admin/users/${resettingUser.TaiKhoan}/reset-password`, values);
      message.success('Đã đặt lại mật khẩu');
      setResettingUser(null);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể đặt lại mật khẩu');
    }
  };

  if (!isAdmin(currentUser?.VaiTro)) {
    return <div>Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  const userFormFields = (includePassword = false) => (
    <>
      <Form.Item name="TaiKhoan" label="Tài khoản" rules={[{ required: true }]}>
        <Input disabled={Boolean(editingUser)} />
      </Form.Item>
      {includePassword && (
        <Form.Item name="MatKhau" label="Mật khẩu tạm" rules={[{ required: true, min: 6 }]}>
          <Input.Password />
        </Form.Item>
      )}
      <Form.Item name="TenDayDu" label="Họ tên">
        <Input />
      </Form.Item>
      <Form.Item name="Gmail" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="SDT" label="Số điện thoại">
        <Input inputMode="numeric" />
      </Form.Item>
      <Form.Item name="VaiTro" label="Vai trò gốc" rules={[{ required: true }]}>
        <Select options={roles.map((item) => ({ value: item, label: item }))} />
      </Form.Item>
    </>
  );

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Tài khoản, họ tên hoặc email"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={loadUsers}
            style={{ width: 260 }}
          />
          <Select allowClear placeholder="Vai trò" value={role} onChange={setRole} style={{ width: 180 }}
            options={roles.map((item) => ({ value: item, label: item }))} />
          <Button icon={<ReloadOutlined />} onClick={loadUsers}>Lọc</Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Cấp tài khoản
        </Button>
      </Space>

      <Table<UserItem>
        rowKey="TaiKhoan"
        loading={loading}
        dataSource={data}
        pagination={{ total, pageSize: 100, showSizeChanger: false }}
        columns={[
          { title: 'Tài khoản', dataIndex: 'TaiKhoan' },
          { title: 'Họ tên', dataIndex: 'TenDayDu', render: (value) => value || '—' },
          { title: 'Email', dataIndex: 'Gmail' },
          { title: 'Vai trò', dataIndex: 'VaiTro', render: (value) => value || '—' },
          {
            title: 'Thao tác',
            render: (_, user) => (
              <Space wrap>
                <Button size="small" onClick={() => { setEditingUser(user); editForm.setFieldsValue(user); }}>Sửa</Button>
                <Button size="small" icon={<LockOutlined />} onClick={() => setResettingUser(user)}>Mật khẩu</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal title="Cấp tài khoản" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
        <Form form={createForm} layout="vertical" onFinish={createUser}>{userFormFields(true)}<Button type="primary" htmlType="submit" block>Tạo tài khoản</Button></Form>
      </Modal>
      <Modal title={`Sửa tài khoản ${editingUser?.TaiKhoan || ''}`} open={Boolean(editingUser)} onCancel={() => setEditingUser(null)} footer={null} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={updateUser}>{userFormFields(false)}<Button type="primary" htmlType="submit" block>Lưu thay đổi</Button></Form>
      </Modal>
      <Modal title={`Đặt lại mật khẩu: ${resettingUser?.TaiKhoan || ''}`} open={Boolean(resettingUser)} onCancel={() => setResettingUser(null)} footer={null} destroyOnClose>
        <Form form={passwordForm} layout="vertical" onFinish={resetPassword}>
          <Form.Item name="MatKhau" label="Mật khẩu mới" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit" block>Đặt lại mật khẩu</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUsers;

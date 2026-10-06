import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Descriptions,
  Grid,
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

  const createUserFields = () => (
    <>
      <Form.Item name="TaiKhoan" label="Tài khoản" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="MatKhau" label="Mật khẩu tạm" rules={[{ required: true, min: 6 }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item name="VaiTro" label="Vai trò gốc" rules={[{ required: true }]}>
        <Select options={roles.map((item) => ({ value: item, label: item }))} />
      </Form.Item>
    </>
  );

  const updateUserFields = () => (
    <>
      <Form.Item name="TaiKhoan" label="Tài khoản"><Input disabled /></Form.Item>
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

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const renderExpandedContent = (user: UserItem) => (
    <div style={{ padding: '4px 0' }}>
      <Descriptions size="small" column={1} bordered={false}>
        <Descriptions.Item label="Email">{user.Gmail || '—'}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{user.SDT || '—'}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setEditingUser(user);
            editForm.setFieldsValue(user);
          }}
        >
          Sửa thông tin
        </Button>
        <Button
          size="small"
          icon={<LockOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            setResettingUser(user);
          }}
        >
          Mật khẩu
        </Button>
      </div>
    </div>
  );

  const desktopColumns = [
    { title: 'Tài khoản', dataIndex: 'TaiKhoan' },
    { title: 'Họ tên', dataIndex: 'TenDayDu', render: (value: any) => value || '—' },
    { title: 'Email', dataIndex: 'Gmail' },
    {
      title: 'Vai trò',
      dataIndex: 'VaiTro',
      render: (value: string) => (value ? <Tag color="blue">{value}</Tag> : '—'),
    },
    {
      title: 'Thao tác',
      render: (_: any, user: UserItem) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => {
              setEditingUser(user);
              editForm.setFieldsValue(user);
            }}
          >
            Sửa
          </Button>
          <Button size="small" icon={<LockOutlined />} onClick={() => setResettingUser(user)}>
            Mật khẩu
          </Button>
        </Space>
      ),
    },
  ];

  const mobileColumns = [
    {
      title: 'Tài khoản / Họ tên',
      key: 'user',
      render: (_: any, user: UserItem) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1677ff' }}>{user.TenDayDu || user.TaiKhoan}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>@{user.TaiKhoan}</div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'VaiTro',
      width: 120,
      align: 'right' as const,
      render: (value: string) => (value ? <Tag color="blue" style={{ margin: 0 }}>{value}</Tag> : '—'),
    },
  ];

  return (
    <div style={{ background: '#fff', padding: isMobile ? 12 : 20, borderRadius: 6 }}>
      <Space
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
          width: '100%',
        }}
        direction={isMobile ? 'vertical' : 'horizontal'}
        wrap
      >
        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
          <Input.Search
            allowClear
            placeholder="Tài khoản, họ tên, email"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={loadUsers}
            style={{ width: isMobile ? '100%' : 260 }}
          />
          <Select
            allowClear
            placeholder="Vai trò"
            value={role}
            onChange={setRole}
            style={{ width: isMobile ? '100%' : 180 }}
            options={roles.map((item) => ({ value: item, label: item }))}
          />
          <Button icon={<ReloadOutlined />} onClick={loadUsers} style={{ width: isMobile ? '100%' : 'auto' }}>
            Lọc
          </Button>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Cấp tài khoản
        </Button>
      </Space>

      <Table<UserItem>
        rowKey="TaiKhoan"
        loading={loading}
        dataSource={data}
        size={isMobile ? 'small' : 'middle'}
        columns={isMobile ? mobileColumns : desktopColumns}
        scroll={isMobile ? undefined : { x: 750 }}
        expandable={
          isMobile
            ? {
                expandedRowRender: renderExpandedContent,
                expandRowByClick: true,
              }
            : undefined
        }
        pagination={{
          total,
          pageSize: 100,
          showSizeChanger: false,
          simple: isMobile,
        }}
      />

      <Modal title="Cấp tài khoản" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
        <Form form={createForm} layout="vertical" onFinish={createUser}>{createUserFields()}<Button type="primary" htmlType="submit" block>Tạo tài khoản</Button></Form>
      </Modal>
      <Modal title={`Sửa tài khoản ${editingUser?.TaiKhoan || ''}`} open={Boolean(editingUser)} onCancel={() => setEditingUser(null)} footer={null} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={updateUser}>{updateUserFields()}<Button type="primary" htmlType="submit" block>Lưu thay đổi</Button></Form>
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

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AutoComplete,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  
  Table,
  Tag,
  message,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  addCouncilMember,
  getCouncilDetail,
  getCouncilTypes,
  removeCouncilMember,
  searchAccounts,
  updateCouncil,
} from '../ThongTinDeTai/CouncilService';
import type { Council, CouncilMember, CouncilPosition, CouncilType } from '../ThongTinDeTai/CouncilService';

const positions: CouncilPosition[] = ['Chủ tịch', 'Thư ký', 'Ủy viên', 'Phản biện'];

const CouncilDetail = () => {
  const { maHoiDong } = useParams<{ maHoiDong: string }>();
  const navigate = useNavigate();
  const councilId = Number(maHoiDong);
  const [council, setCouncil] = useState<Council>();
  const [types, setTypes] = useState<CouncilType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [accountOptions, setAccountOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [account, setAccount] = useState('');
  const [position, setPosition] = useState<CouncilPosition>('Ủy viên');
  const [form] = Form.useForm();

  const loadData = async () => {
    if (!Number.isInteger(councilId) || councilId <= 0) return;
    try {
      setLoading(true);
      const [detail, typeData] = await Promise.all([getCouncilDetail(councilId), getCouncilTypes()]);
      setCouncil(detail);
      setTypes(typeData);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải thông tin hội đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [maHoiDong]);

  const members = council?.ThanhVienHoiDong ?? [];
  

  const findAccounts = async (keyword: string) => {
    if (!keyword.trim()) return setAccountOptions([]);
    try {
      const existed = new Set(members.map((member) => member.TaiKhoan));
      const accounts = await searchAccounts(keyword);
      setAccountOptions(accounts.filter((item) => !existed.has(item.TaiKhoan)).map((item) => ({
        value: item.TaiKhoan,
        label: `${item.TaiKhoan}${item.TenDayDu ? ` — ${item.TenDayDu}` : ''}${item.VaiTro ? ` (${item.VaiTro})` : ''}`,
      })));
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tìm tài khoản');
    }
  };

  const addMember = async () => {
    if (!account) return message.warning('Vui lòng chọn tài khoản');
    try {
      await addCouncilMember(councilId, account, position);
      message.success('Đã thêm thành viên');
      setAccount('');
      setAccountOptions([]);
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể thêm thành viên');
    }
  };

  const removeMember = async (member: CouncilMember) => {
    try {
      await removeCouncilMember(councilId, member.TaiKhoan);
      message.success('Đã xóa thành viên khỏi hội đồng');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa thành viên');
    }
  };

  const saveCouncil = async () => {
    try {
      const values = await form.validateFields();
      await updateCouncil(councilId, values);
      message.success('Đã cập nhật hội đồng');
      setEditing(false);
      loadData();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể cập nhật hội đồng');
    }
  };

  const startEdit = () => {
    form.setFieldsValue(council);
    setEditing(true);
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (!council) return <div style={{ padding: 24 }}>Không tìm thấy hội đồng.</div>;

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mainhome/admin/councils')}>Danh sách hội đồng</Button>
      </Space>
      <Card title="Thông tin hội đồng" extra={editing ? <Space><Button onClick={() => setEditing(false)}>Hủy</Button><Button type="primary" icon={<SaveOutlined />} onClick={saveCouncil}>Lưu</Button></Space> : <Button icon={<EditOutlined />} onClick={startEdit}>Chỉnh sửa</Button>}>
        {editing ? (
          <Form form={form} layout="vertical">
            <Form.Item name="TenHoiDong" label="Tên hội đồng" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="MaLoaiHoiDong" label="Loại hội đồng" rules={[{ required: true }]}><Select options={types.map((type) => ({ value: type.MaLoaiHoiDong, label: type.TenLoaiHoiDong }))} /></Form.Item>
            <Form.Item name="MoTa" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item
              label="Năm bắt đầu"
              name="NamBatDau"
              rules={[{ required: true, message: "Nhập năm bắt đầu" }]}
            >
              <InputNumber min={2000} max={2100} />
            </Form.Item>
            <Form.Item
              label="Năm kết thúc"
              name="NamKetThuc"
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
            >
              <InputNumber min={2000} max={2100} />
            </Form.Item>
          </Form>
        ) : (
          <Descriptions column={1}>
            <Descriptions.Item label="Mã hội đồng">{council.MaHoiDong}</Descriptions.Item>
            <Descriptions.Item label="Tên hội đồng">{council.TenHoiDong}</Descriptions.Item>
            <Descriptions.Item label="Loại hội đồng">{council.LoaiHoiDong?.TenLoaiHoiDong || '—'}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">{council.MoTa || '—'}</Descriptions.Item>
            <Descriptions.Item label="Năm hoạt động">
              {council.NamBatDau} - {council.NamKetThuc}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      

      <Card title="Thành viên hội đồng">
        <Space style={{ display: 'flex', marginBottom: 16 }} wrap>
          <AutoComplete style={{ minWidth: 300 }} options={accountOptions} value={account} onSearch={findAccounts} onChange={setAccount} onSelect={(value) => setAccount(value)} placeholder="Tìm tài khoản để thêm" />
          <Select value={position} onChange={setPosition} style={{ width: 150 }} options={positions.map((item) => ({ value: item, label: item }))} />
          <Button type="primary" icon={<PlusOutlined />} onClick={addMember}>Thêm thành viên</Button>
        </Space>
        <Table<CouncilMember>
          rowKey="Id"
          dataSource={members}
          pagination={false}
          columns={[
            { title: 'Tài khoản', dataIndex: 'TaiKhoan' },
            { title: 'Họ tên', render: (_, member) => member.NguoiDung?.TenDayDu || '—' },
            { title: 'Role gốc', render: (_, member) => member.NguoiDung?.VaiTro || '—' },
            { title: 'Chức danh', dataIndex: 'ChucDanh', render: (value) => <Tag color={value === 'Chủ tịch' ? 'gold' : value === 'Thư ký' ? 'blue' : 'default'}>{value}</Tag> },
            { title: 'Thao tác', render: (_, member) => <Popconfirm title="Xóa thành viên này?" onConfirm={() => removeMember(member)}><Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button></Popconfirm> },
          ]}
        />
      </Card>
    </div>
  );
};

export default CouncilDetail;

import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  createCouncil,
  createCouncilType,
  deleteCouncil,
  getCouncilTypes,
  getCouncils,
} from '../ThongTinDeTai/CouncilService';
import type { Council, CouncilBusiness, CouncilType } from '../ThongTinDeTai/CouncilService';

const businessOptions: Array<{ value: CouncilBusiness; label: string }> = [
  { value: 'approval', label: 'Xét duyệt đề tài' },
  { value: 'scoring', label: 'Nghiệm thu / chấm điểm' },
  { value: 'monitoring', label: 'Theo dõi' },
  { value: 'liquidation', label: 'Thanh lý' },
  { value: 'other', label: 'Khác' },
];

const CouncilList = () => {
  const navigate = useNavigate();
  const [councils, setCouncils] = useState<Council[]>([]);
  const [types, setTypes] = useState<CouncilType[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [form] = Form.useForm();
  const [typeForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [councilData, typeData] = await Promise.all([getCouncils(), getCouncilTypes()]);
      setCouncils(councilData);
      setTypes(typeData);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách hội đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredCouncils = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return councils;
    return councils.filter((council) =>
      council.TenHoiDong.toLowerCase().includes(search) ||
      council.LoaiHoiDong?.TenLoaiHoiDong.toLowerCase().includes(search),
    );
  }, [councils, keyword]);

  const submitCouncil = async () => {
    try {
      const values = await form.validateFields();
      await createCouncil(values);
      message.success('Đã tạo hội đồng');
      setCreateOpen(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể tạo hội đồng');
    }
  };

  const submitType = async () => {
    try {
      const values = await typeForm.validateFields();
      const created = await createCouncilType(values);
      message.success('Đã thêm loại hội đồng');
      setTypes((current) => [...current, created].sort((a, b) => a.TenLoaiHoiDong.localeCompare(b.TenLoaiHoiDong)));
      form.setFieldValue('MaLoaiHoiDong', created.MaLoaiHoiDong);
      setTypeOpen(false);
      typeForm.resetFields();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể thêm loại hội đồng');
    }
  };

  const removeCouncil = async (id: number) => {
    try {
      await deleteCouncil(id);
      message.success('Đã xóa hội đồng');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa hội đồng');
    }
  };

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc loại hội đồng"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo hội đồng</Button>
      </Space>

      <Table<Council>
        rowKey="MaHoiDong"
        loading={loading}
        dataSource={filteredCouncils}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Mã', dataIndex: 'MaHoiDong', width: 80 },
          {
            title: 'Tên hội đồng',
            dataIndex: 'TenHoiDong',
            render: (name: string, council) => <Button type="link" onClick={() => navigate(`/mainhome/admin/councils/${council.MaHoiDong}`)}>{name}</Button>,
          },
          { title: 'Loại hội đồng', render: (_, council) => <Tag>{council.LoaiHoiDong?.TenLoaiHoiDong || '—'}</Tag> },
          { title: 'Mô tả', dataIndex: 'MoTa', render: (value) => value || '—' },
          {
            title: 'Thao tác',
            render: (_, council) => (
              <Popconfirm title="Xóa hội đồng này?" description="Chỉ xóa được hội đồng chưa gán đề tài." onConfirm={() => removeCouncil(council.MaHoiDong)}>
                <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal title="Tạo hội đồng" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={submitCouncil} okText="Tạo" cancelText="Hủy" destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="TenHoiDong" label="Tên hội đồng" rules={[{ required: true, message: 'Vui lòng nhập tên hội đồng' }]}>
            <Input placeholder="Ví dụ: Hội đồng xét duyệt CNTT đợt 1" />
          </Form.Item>
          <Form.Item name="MaLoaiHoiDong" label="Loại hội đồng" rules={[{ required: true, message: 'Vui lòng chọn loại hội đồng' }]}>
            <Select placeholder="Chọn loại hội đồng" options={types.map((type) => ({ value: type.MaLoaiHoiDong, label: type.TenLoaiHoiDong }))} />
          </Form.Item>
          <Button type="link" style={{ padding: 0, marginBottom: 16 }} onClick={() => setTypeOpen(true)}>+ Thêm loại hội đồng mới</Button>
          <Form.Item name="MoTa" label="Mô tả"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Thêm loại hội đồng" open={typeOpen} onCancel={() => setTypeOpen(false)} onOk={submitType} okText="Thêm" cancelText="Hủy" destroyOnClose>
        <Form form={typeForm} layout="vertical" initialValues={{ NghiepVu: 'other' }}>
          <Form.Item name="TenLoaiHoiDong" label="Tên loại hội đồng" rules={[{ required: true, message: 'Vui lòng nhập tên loại' }]}><Input /></Form.Item>
          <Form.Item name="NghiepVu" label="Nghiệp vụ" rules={[{ required: true }]}><Select options={businessOptions} /></Form.Item>
          <Form.Item name="MoTa" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouncilList;

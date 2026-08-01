import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  createLoaiTaiLieu,
  deleteLoaiTaiLieu,
  getLoaiTaiLieuList,
  updateLoaiTaiLieu,
} from '../../services/topic/DocumentsService';
import type { LoaiTaiLieu, NghiepVuLoai } from '../../services/topic/DocumentsService';

const nghiepVuOptions: Array<{ value: NghiepVuLoai; label: string }> = [
  { value: 'dang_ky', label: 'Đăng ký' },
  { value: 'theo_doi', label: 'Theo dõi' },
  { value: 'nghiem_thu', label: 'Nghiệm thu' },
  { value: 'thanh_ly', label: 'Thanh lý' },
];

const DocumentList = () => {
  const [items, setItems] = useState<LoaiTaiLieu[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LoaiTaiLieu | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      setItems(await getLoaiTaiLieuList());
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh mục loại tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredItems = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => item.TenLoaiTL.toLowerCase().includes(search));
  }, [items, keyword]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ DangSuDung: true, NghiepVu: [] });
    setModalOpen(true);
  };

  const openEdit = (item: LoaiTaiLieu) => {
    setEditingItem(item);
    form.setFieldsValue({
      TenLoaiTL: item.TenLoaiTL,
      MoTa: item.MoTa,
      DangSuDung: item.DangSuDung,
      NghiepVu: item.NghiepVuList.map((nv) => nv.NghiepVu),
      BatBuocMap: Object.fromEntries(item.NghiepVuList.map((nv) => [nv.NghiepVu, nv.BatBuoc])),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      const selectedNghiepVu: NghiepVuLoai[] = values.NghiepVu || [];
      const batBuocMap = values.BatBuocMap || {};

      const payload = {
        TenLoaiTL: values.TenLoaiTL,
        MoTa: values.MoTa,
        DangSuDung: values.DangSuDung,
        NghiepVuList: selectedNghiepVu.map((nv) => ({
          NghiepVu: nv,
          BatBuoc: !!batBuocMap[nv],
        })),
      };

      if (editingItem) {
        await updateLoaiTaiLieu(editingItem.MaLoaiTL, payload);
        message.success('Đã cập nhật loại tài liệu');
      } else {
        await createLoaiTaiLieu(payload);
        message.success('Đã tạo loại tài liệu');
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể lưu loại tài liệu');
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteLoaiTaiLieu(id);
      message.success('Đã xóa loại tài liệu');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa loại tài liệu');
    }
  };

  const selectedNghiepVu: NghiepVuLoai[] = Form.useWatch('NghiepVu', form) || [];

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên loại tài liệu"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo loại tài liệu</Button>
      </Space>

      <Table<LoaiTaiLieu>
        rowKey="MaLoaiTL"
        loading={loading}
        dataSource={filteredItems}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Tên loại tài liệu', dataIndex: 'TenLoaiTL' },
          { title: 'Mô tả', dataIndex: 'MoTa', render: (value) => value || '—' },
          {
            title: 'Áp dụng cho nghiệp vụ',
            render: (_, record) => (
              <Space wrap>
                {record.NghiepVuList.map((nv) => {
                  const label = nghiepVuOptions.find((opt) => opt.value === nv.NghiepVu)?.label || nv.NghiepVu;
                  return (
                    <Tag key={nv.Id} color={nv.BatBuoc ? 'red' : 'default'}>
                      {label}{nv.BatBuoc ? ' (bắt buộc)' : ''}
                    </Tag>
                  );
                })}
              </Space>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'DangSuDung',
            width: 120,
            render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'Đang dùng' : 'Ngừng dùng'}</Tag>,
          },
          {
            title: 'Thao tác',
            width: 140,
            render: (_, record) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                <Popconfirm title="Xóa loại tài liệu này?" description="Chỉ nên xóa nếu chưa có tài liệu nào dùng loại này." onConfirm={() => remove(record.MaLoaiTL)}>
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingItem ? 'Sửa loại tài liệu' : 'Tạo loại tài liệu'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editingItem ? 'Lưu' : 'Tạo'}
        cancelText="Hủy"
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="TenLoaiTL" label="Tên loại tài liệu" rules={[{ required: true, message: 'Vui lòng nhập tên loại tài liệu' }]}>
            <Input placeholder="Ví dụ: Biên bản họp" />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="DangSuDung" label="Đang sử dụng" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="NghiepVu" label="Áp dụng cho nghiệp vụ">
            <Checkbox.Group options={nghiepVuOptions} />
          </Form.Item>

          {selectedNghiepVu.length > 0 && (
            <Form.Item label="Đánh dấu bắt buộc theo từng nghiệp vụ" style={{ marginBottom: 0 }}>
              <Space direction="vertical">
                {selectedNghiepVu.map((nv) => {
                  const label = nghiepVuOptions.find((opt) => opt.value === nv)?.label;
                  return (
                    <Form.Item key={nv} name={['BatBuocMap', nv]} valuePropName="checked" noStyle>
                      <Checkbox>Bắt buộc ở "{label}"</Checkbox>
                    </Form.Item>
                  );
                })}
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentList;

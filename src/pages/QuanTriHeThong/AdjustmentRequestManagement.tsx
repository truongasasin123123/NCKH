import { useCallback, useEffect, useState, type Key } from 'react';
import { Button, DatePicker, Descriptions, Drawer, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getAdminAdjustmentRequests,
  applyAdjustmentRequest,
  deleteAdjustmentRequest,
  reviewAdjustmentRequest,
  type AdjustmentRequest,
  type AdjustmentRequestStatus,
} from '../../services/topic/AdjustmentRequestService';
import { downloadDocument } from '../../services/topic/DocumentsService';
import { getMocTienDoByTopic, type MocTienDo } from '../../services/progress/ProgressService';

const statusColor: Record<AdjustmentRequestStatus, string> = {
  'Chờ duyệt': 'processing',
  'Đã chấp nhận': 'success',
  'Từ chối': 'error',
};

const uniqueItems = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

const renderLines = (value?: string) => {
  const items = uniqueItems((value || '').split(/\r?\n/));
  return <ul style={{ margin: 0, paddingLeft: 18 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
};

const renderAdjustmentGroups = (value: string) => {
  const groups = new Map<string, string[]>();
  uniqueItems(value.split('|')).forEach((item) => {
    const separatorIndex = item.indexOf(':');
    const group = separatorIndex >= 0 ? item.slice(0, separatorIndex).trim() : item;
    const field = separatorIndex >= 0 ? item.slice(separatorIndex + 1).trim() : '';
    groups.set(group, uniqueItems([...(groups.get(group) || []), field]));
  });
  return <ul style={{ margin: 0, paddingLeft: 18 }}>{[...groups.entries()].map(([group, fields]) => (
    <li key={group}>
      {group}
      {fields.length > 0 && <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{fields.map((field) => <li key={field}>{field}</li>)}</ul>}
    </li>
  ))}</ul>;
};

const getRequestedProjectValues = (value: string) => {
  const labels: Record<string, 'TenDT' | 'ChuyenNganh' | 'Khoa' | 'PhanLoai' | 'MoTa'> = {
    'Tên đề tài': 'TenDT',
    'Chuyên ngành': 'ChuyenNganh',
    'Khoa': 'Khoa',
    'Phân loại': 'PhanLoai',
    'Mô tả / nội dung nghiên cứu': 'MoTa',
  };
  return uniqueItems(value.split(/\r?\n/)).reduce<Record<string, string>>((result, line) => {
    const separatorIndex = line.indexOf(':');
    const label = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : '';
    const field = labels[label];
    if (field) result[field] = line.slice(separatorIndex + 1).trim();
    return result;
  }, {});
};

interface AdjustmentRequestManagementProps {
  embedded?: boolean;
}

export default function AdjustmentRequestManagement({ embedded = false }: AdjustmentRequestManagementProps) {
  const [data, setData] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AdjustmentRequestStatus | undefined>('Chờ duyệt');
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AdjustmentRequest>();
  const [rejecting, setRejecting] = useState<AdjustmentRequest>();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [applying, setApplying] = useState<AdjustmentRequest>();
  const [milestones, setMilestones] = useState<MocTienDo[]>([]);
  const [rejectForm] = Form.useForm<{ reason: string }>();
  const [applyForm] = Form.useForm();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminAdjustmentRequests({ status, limit: 50 });
      setData(response.data);
      setTotal(response.total);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách phiếu điều chỉnh');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (request: AdjustmentRequest) => {
    try {
      setSubmitting(true);
      const updated = await reviewAdjustmentRequest(request.Id, 'accepted');
      message.success('Đã chấp nhận phiếu điều chỉnh');
      setSelected(undefined);
      await load();

      await openApplyModal(updated);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể chấp nhận phiếu');
    } finally {
      setSubmitting(false);
    }
  };
  const reject = async () => {
    if (!rejecting) return;
    try {
      const { reason } = await rejectForm.validateFields();
      setSubmitting(true);
      await reviewAdjustmentRequest(rejecting.Id, 'rejected', reason);
      message.success('Đã từ chối phiếu điều chỉnh');
      rejectForm.resetFields();
      setRejecting(undefined);
      setSelected(undefined);
      await load();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Không thể từ chối phiếu');
    } finally {
      setSubmitting(false);
    }
  };

  const openApplyModal = async (request: AdjustmentRequest) => {
    try {
      setApplying(request);
      const data = await getMocTienDoByTopic(request.MaDT);
      setMilestones(data);
      applyForm.resetFields();
      applyForm.setFieldsValue({
        ThongTinDeTai: getRequestedProjectValues(request.NoiDungDeNghi),
        GhiChuApDung: `Áp dụng theo phiếu điều chỉnh #${request.Id}.`,
      });
    } catch {
      message.error('Không thể tải danh sách mốc tiến độ');
      setApplying(undefined);
    }
  };

  const applyChanges = async () => {
    if (!applying) return;
    try {
      const values = await applyForm.validateFields();
      const payload = {
        ThongTinDeTai: values.ThongTinDeTai,
        Milestones: values.Milestones?.map((item: { MaMoc: number; NgayKetThuc: { format: (format: string) => string } }) => ({
          MaMoc: item.MaMoc,
          NgayKetThuc: item.NgayKetThuc.format('YYYY-MM-DD'),
        })),
        ThanhVien: values.ThanhVien?.map((item: { TaiKhoan: string; VaiTroDT: string }) => ({
          TaiKhoan: item.TaiKhoan.trim(),
          VaiTroDT: item.VaiTroDT.trim(),
        })),
        GhiChuApDung: values.GhiChuApDung?.trim() || undefined,
      };
      await applyAdjustmentRequest(applying.Id, payload);
      message.success('Đã áp dụng thay đổi vào đề tài');
      setApplying(undefined);
      setSelected(undefined);
      await load();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || 'Không thể áp dụng thay đổi');
    }
  };

  const deleteSelected = async () => {
    try {
      setSubmitting(true);
      await Promise.all(selectedRowKeys.map((id) => deleteAdjustmentRequest(Number(id))));
      message.success(`Đã xóa ${selectedRowKeys.length} phiếu điều chỉnh`);
      setSelectedRowKeys([]);
      setSelected(undefined);
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa phiếu điều chỉnh');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<AdjustmentRequest> = [
    { title: 'Đề tài', render: (_, item) => item.DeTai?.TenDT || item.MaDT },
    { title: 'Người gửi', render: (_, item) => item.NguoiGui?.TenDayDu || item.TaiKhoanNguoiGui },
    { title: 'Ngày gửi', dataIndex: 'NgayGui', width: 120, render: (value) => new Date(value).toLocaleDateString('vi-VN') },
    { title: 'Trạng thái', dataIndex: 'TrangThai', width: 140, render: (value: AdjustmentRequestStatus) => <Tag color={statusColor[value]}>{value}</Tag> },
    {
      title: 'Thao tác', width: 110,
      render: (_, item) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(item)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={embedded ? undefined : { background: '#fff', padding: 20, borderRadius: 6 }}>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Select
          value={status}
          allowClear
          placeholder="Lọc trạng thái"
          style={{ width: 190 }}
          onChange={setStatus}
          options={Object.keys(statusColor).map((value) => ({ value, label: value }))}
        />
        <Popconfirm
          title="Xóa phiếu điều chỉnh"
          description={`Bạn có chắc muốn xóa ${selectedRowKeys.length} phiếu đã chọn?`}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true, loading: submitting }}
          onConfirm={deleteSelected}
          disabled={!selectedRowKeys.length}
        >
          <Button danger disabled={!selectedRowKeys.length} loading={submitting}>
            Xóa phiếu {selectedRowKeys.length ? `(${selectedRowKeys.length})` : ''}
          </Button>
        </Popconfirm>
      </Space>
      <Table
        rowKey="Id"
        loading={loading}
        dataSource={data}
        columns={columns}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ total, pageSize: 50, showSizeChanger: false }}
      />

      <Drawer title="Chi tiết phiếu điều chỉnh" open={Boolean(selected)} onClose={() => setSelected(undefined)} width={680}>
        {selected && <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Đề tài">{selected.DeTai?.TenDT || selected.MaDT}</Descriptions.Item>
            <Descriptions.Item label="Người gửi">{selected.NguoiGui?.TenDayDu || selected.TaiKhoanNguoiGui}</Descriptions.Item>
            <Descriptions.Item label="Nhóm điều chỉnh">{renderAdjustmentGroups(selected.NhomDieuChinh)}</Descriptions.Item>
            <Descriptions.Item label="Thông tin hiện tại">{renderLines(selected.ThongTinHienTai)}</Descriptions.Item>
            <Descriptions.Item label="Nội dung đề nghị">{renderLines(selected.NoiDungDeNghi)}</Descriptions.Item>
            <Descriptions.Item label="Lý do">{selected.LyDo}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color={statusColor[selected.TrangThai]}>{selected.TrangThai}</Tag></Descriptions.Item>
            {selected.DaApDung && <Descriptions.Item label="Đã áp dụng">{selected.NoiDungDaApDung || 'Đã áp dụng thay đổi vào đề tài'}</Descriptions.Item>}
            {selected.LyDoTuChoi && <Descriptions.Item label="Lý do từ chối">{selected.LyDoTuChoi}</Descriptions.Item>}
          </Descriptions>
          <div style={{ marginTop: 20 }}><b>Tài liệu đính kèm</b></div>
          {selected.TaiLieu?.length ? selected.TaiLieu.map((file) => <Button key={file.MaTL} icon={<DownloadOutlined />} style={{ marginTop: 8, marginRight: 8 }} onClick={() => downloadDocument(file.MaTL, file.TenFile)}>{file.TenFile}</Button>) : <p>Chưa có tài liệu đính kèm.</p>}
          {selected.TrangThai === 'Chờ duyệt' && <Space style={{ marginTop: 24 }}>
            <Button type="primary" loading={submitting} onClick={() => approve(selected)}>Chấp nhận</Button>
            <Button danger loading={submitting} onClick={() => setRejecting(selected)}>Từ chối</Button>
          </Space>}
          {selected.TrangThai === 'Đã chấp nhận' && !selected.DaApDung && (
            <Button type="primary" style={{ marginTop: 24 }} onClick={() => openApplyModal(selected)}>
              Áp dụng thay đổi
            </Button>
          )}
        </>}
      </Drawer>

      <Modal title="Từ chối phiếu điều chỉnh" open={Boolean(rejecting)} onCancel={() => { rejectForm.resetFields(); setRejecting(undefined); }} onOk={reject} confirmLoading={submitting} okText="Xác nhận từ chối" okButtonProps={{ danger: true }}>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, whitespace: true, message: 'Nhập lý do từ chối' }]}>
            <Input.TextArea rows={4} placeholder="Nêu rõ nội dung cần nhóm trưởng bổ sung hoặc chỉnh sửa." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Admin áp dụng điều chỉnh"
        open={Boolean(applying)}
        onCancel={() => setApplying(undefined)}
        onOk={applyChanges}
        okText="Áp dụng vào đề tài"
        width={720}
      >
        {applying && <Form form={applyForm} layout="vertical">
          {applying.NhomDieuChinh.includes('Nội dung nghiên cứu') && <>
            {[
              ['Tên đề tài', 'TenDT'],
              ['Chuyên ngành', 'ChuyenNganh'],
              ['Khoa', 'Khoa'],
              ['Phân loại', 'PhanLoai'],
              ['Mô tả / nội dung nghiên cứu', 'MoTa'],
            ].filter(([label]) => applying.NhomDieuChinh.includes(label)).map(([label, field]) => (
              <Form.Item key={field} name={['ThongTinDeTai', field]} label={`${label} sau điều chỉnh`} rules={[{ required: true, whitespace: true, message: `Nhập ${label.toLowerCase()} chính thức` }]}>
                {field === 'MoTa' ? <Input.TextArea rows={4} /> : <Input />}
              </Form.Item>
            ))}
          </>}
          {applying.NhomDieuChinh.includes('Tiến độ / mốc thực hiện') && (
            <Form.List name="Milestones">
              {(fields, { add, remove }) => <>
                <div style={{ marginBottom: 8 }}>Mốc tiến độ và hạn kết thúc chính thức</div>
                {fields.map((field) => <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item {...field} name={[field.name, 'MaMoc']} rules={[{ required: true, message: 'Chọn mốc' }]}>
                    <Select placeholder="Chọn mốc" style={{ width: 310 }} options={milestones.map((item) => ({ value: item.MaMoc, label: `${item.TenMoc} (${item.MaMoc})` }))} />
                  </Form.Item>
                  <Form.Item {...field} name={[field.name, 'NgayKetThuc']} rules={[{ required: true, message: 'Chọn hạn kết thúc' }]}>
                    <DatePicker format="DD/MM/YYYY" />
                  </Form.Item>
                  <Button danger onClick={() => remove(field.name)}>Xóa</Button>
                </Space>)}
                <Button onClick={() => add()}>Thêm mốc cần điều chỉnh</Button>
              </>}
            </Form.List>
          )}
          {applying.NhomDieuChinh.includes('Thành viên thực hiện') && (
            <Form.List name="ThanhVien">
              {(fields, { add, remove }) => <>
                <div style={{ margin: '20px 0 8px' }}>Danh sách thành viên thay thế toàn bộ danh sách hiện tại</div>
                {fields.map((field) => <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item {...field} name={[field.name, 'TaiKhoan']} rules={[{ required: true, whitespace: true, message: 'Nhập tài khoản' }]}><Input placeholder="Tài khoản" /></Form.Item>
                  <Form.Item {...field} name={[field.name, 'VaiTroDT']} rules={[{ required: true, whitespace: true, message: 'Nhập vai trò' }]}><Input placeholder="Nhóm trưởng / Thành viên" /></Form.Item>
                  <Button danger onClick={() => remove(field.name)}>Xóa</Button>
                </Space>)}
                <Button onClick={() => add()}>Thêm thành viên</Button>
              </>}
            </Form.List>
          )}
          <Form.Item name="GhiChuApDung" label="Ghi chú áp dụng"><Input.TextArea rows={2} /></Form.Item>
        </Form>}
      </Modal>
    </div>
  );
}

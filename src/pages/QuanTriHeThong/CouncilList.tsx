import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, message, DatePicker, Radio } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  approveCouncilRequest,
  createCouncil,
  createCouncilType,
  deleteCouncil,
  deleteCouncilType,
  getCouncilRequests,
  getCouncils,
  getCouncilTypes,
  rejectCouncilRequest,
  updateCouncilType,
} from '../../services/council/CouncilService';
import type {
  Council,
  CouncilAssignmentRequest,
  CouncilBusiness,
  CouncilMeetingType,
  CouncilType,
} from '../../services/council/CouncilService';
import CouncilRequestDetailModal from './CouncilRequestDetailModal';
import type { Dayjs } from 'dayjs';

const businessOptions: Array<{ value: CouncilBusiness; label: string }> = [
  { value: 'approval', label: 'Xét duyệt đề tài' },
  { value: 'scoring', label: 'Nghiệm thu / chấm điểm' },
  { value: 'monitoring', label: 'Theo dõi' },
  { value: 'liquidation', label: 'Thanh lý' },
  { value: 'other', label: 'Khác' },
];

const requestStatusTag = (status: CouncilAssignmentRequest['TrangThai']) => {
  const map: Record<string, { color: string; label: string }> = {
    'Chờ duyệt': { color: 'blue', label: 'Chờ duyệt' },
    'Đã chấp nhận': { color: 'green', label: 'Đã chấp nhận' },
    'Từ chối': { color: 'red', label: 'Từ chối' },
  };
  const info = map[status] || { color: 'default', label: status };
  return <Tag color={info.color}>{info.label}</Tag>;
};

const CouncilList = () => {
  const navigate = useNavigate();
  const [councils, setCouncils] = useState<Council[]>([]);
  const [requests, setRequests] = useState<CouncilAssignmentRequest[]>([]);
  const [loadingCouncils, setLoadingCouncils] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [requestKeyword, setRequestKeyword] = useState('');
  const [councilTypeKeyword, setCouncilTypeKeyword] = useState('');
  const [councilOpen, setCouncilOpen] = useState(false);
  const [councilForm] = Form.useForm();
  const [councilTypeOpen, setCouncilTypeOpen] = useState(false);
  const [councilTypeForm] = Form.useForm();
  const [editingCouncilType, setEditingCouncilType] = useState<CouncilType | null>(null);
  const [councilTypes, setCouncilTypes] = useState<CouncilType[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<CouncilAssignmentRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const loadCouncils = async () => {
    try {
      setLoadingCouncils(true);
      const councilData = await getCouncils();
      setCouncils(councilData);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách hội đồng');
    } finally {
      setLoadingCouncils(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await getCouncilRequests('Chờ duyệt');
      setRequests(data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadCouncilTypes = async () => {
    try {
      setCouncilTypes(await getCouncilTypes());
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể tải loại hội đồng');
    }
  };

  useEffect(() => {
    void Promise.all([loadCouncils(), loadRequests(), loadCouncilTypes()]);
  }, []);

  const filteredCouncils = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return councils;
    return councils.filter((council) =>
      council.TenHoiDong.toLowerCase().includes(search) ||
      council.LoaiHoiDong?.TenLoaiHoiDong.toLowerCase().includes(search),
    );
  }, [councils, keyword]);

  const filteredRequests = useMemo(() => {
    const search = requestKeyword.trim().toLowerCase();
    if (!search) return requests;
    return requests.filter((request) =>
      (request.DeTai?.TenDT || request.MaDT).toLowerCase().includes(search) ||
      (request.NguoiGui?.TenDayDu || request.TaiKhoanNguoiGui).toLowerCase().includes(search),
    );
  }, [requests, requestKeyword]);

  const filteredCouncilTypes = useMemo(() => {
    const search = councilTypeKeyword.trim().toLowerCase();
    if (!search) return councilTypes;
    return councilTypes.filter((type) =>
      type.TenLoaiHoiDong.toLowerCase().includes(search) ||
      type.NghiepVu.toLowerCase().includes(search),
    );
  }, [councilTypes, councilTypeKeyword]);

  const submitCouncil = async () => {
    try {
      const values = await councilForm.validateFields();
      const payload = {
        ...values,
        ThoiGianHop: values.ThoiGianHop ? (values.ThoiGianHop as Dayjs).toISOString() : undefined,
      };
      await createCouncil(payload);
      message.success('Đã tạo hội đồng');
      await loadCouncils();
      setCouncilOpen(false);
      councilForm.resetFields();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể tạo hội đồng');
    }
  };

  const submitCouncilType = async () => {
    try {
      const values = await councilTypeForm.validateFields();
      if (editingCouncilType) {
        await updateCouncilType(editingCouncilType.MaLoaiHoiDong, values);
        message.success('Đã cập nhật loại hội đồng');
      } else {
        await createCouncilType(values);
        message.success('Đã tạo loại hội đồng');
      }
      await loadCouncilTypes();
      setCouncilTypeOpen(false);
      setEditingCouncilType(null);
      councilTypeForm.resetFields();
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.response?.data?.message || 'Không thể tạo loại hội đồng');
    }
  };

  const openCreateCouncilType = () => {
    setEditingCouncilType(null);
    councilTypeForm.resetFields();
    councilTypeForm.setFieldsValue({ NghiepVu: 'other' });
    setCouncilTypeOpen(true);
  };

  const openEditCouncilType = (type: CouncilType) => {
    setEditingCouncilType(type);
    councilTypeForm.setFieldsValue(type);
    setCouncilTypeOpen(true);
  };

  const removeCouncilType = async (id: number) => {
    try {
      await deleteCouncilType(id);
      message.success('Đã xóa loại hội đồng');
      await loadCouncilTypes();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa loại hội đồng');
    }
  };

  const removeCouncil = async (id: number) => {
    try {
      await deleteCouncil(id);
      message.success('Đã xóa hội đồng');
      loadCouncils();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể xóa hội đồng');
    }
  };

  const openRequestDetail = (request: CouncilAssignmentRequest) => {
    setSelectedRequest(request);
    setDetailOpen(true);
  };

  const handleApproveRequest = async (councilId: number) => {
    if (!selectedRequest) return;
    try {
      setApproving(true);
      await approveCouncilRequest(selectedRequest.Id, councilId);
      message.success('Đã chấp nhận yêu cầu và phân công hội đồng');
      setDetailOpen(false);
      setSelectedRequest(null);
      await Promise.all([loadCouncils(), loadRequests()]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể phê duyệt yêu cầu');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectRequest = async (reason: string) => {
    if (!selectedRequest) return;
    try {
      setRejecting(true);
      await rejectCouncilRequest(selectedRequest.Id, reason);
      message.success('Đã từ chối yêu cầu');
      setDetailOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setRejecting(false);
    }
  };

  const renderMoTa = (value?: string) => {
    if (!value) return '—';
    const parts = value.split(/(https?:\/\/[^\s]+)/g);
    return (
      <div style={{ whiteSpace: 'pre-line' }}>
        {parts.map((part, index) =>
          /^https?:\/\//.test(part) ? (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
      </div>
    );
  };
  const requestsTab = (
    <>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên đề tài hoặc người gửi"
          value={requestKeyword}
          onChange={(event) => setRequestKeyword(event.target.value)}
          style={{ width: 300 }}
        />
      </Space>

      <Table<CouncilAssignmentRequest>
        rowKey="Id"
        loading={loadingRequests}
        dataSource={filteredRequests}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Đề tài / hồ sơ', render: (_, request) => <>{request.DeTai?.TenDT || request.MaDT}{request.MaBaoCaoTienDo && <div style={{ color: '#8c8c8c', fontSize: 12 }}>Nghiệm thu từng phần · Hồ sơ #{request.MaBaoCaoTienDo}</div>}</> },
          {
            title: 'Loại hội đồng yêu cầu',
            render: (_, request) => <Tag color="purple">{request.LoaiHoiDong?.TenLoaiHoiDong || `Loại #${request.MaLoaiHoiDong}`}</Tag>,
          },
          { title: 'Người gửi', render: (_, request) => request.NguoiGui?.TenDayDu || request.TaiKhoanNguoiGui },
          {
            title: 'Ngày gửi',
            dataIndex: 'NgayGui',
            render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'TrangThai',
            render: (value: CouncilAssignmentRequest['TrangThai']) => requestStatusTag(value),
          },
          {
            title: 'Thao tác',
            render: (_, request) => (
              <Button type="link" onClick={() => openRequestDetail(request)}>Xem chi tiết</Button>
            ),
          },
        ]}
      />
    </>
  );

  const councilsTab = (
    <>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc loại hội đồng"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCouncilOpen(true)}>Tạo hội đồng</Button>
      </Space>

      <Table<Council>
        rowKey="MaHoiDong"
        loading={loadingCouncils}
        dataSource={filteredCouncils}
        pagination={{ pageSize: 10 }}
        columns={[
          {
            title: 'Mã', dataIndex: 'MaHoiDong', width: 80, sorter: (a: Council, b: Council) => a.MaHoiDong - b.MaHoiDong,
            defaultSortOrder: 'ascend',
          },
          {
            title: 'Tên hội đồng',
            dataIndex: 'TenHoiDong',
            render: (name: string, council) => <Button type="link" onClick={() => navigate(`/mainhome/admin/councils/${council.MaHoiDong}`)}>{name}</Button>,
          },
          {
            title: 'Loại hội đồng', render: (_, council) => <Tag>{council.LoaiHoiDong?.TenLoaiHoiDong || '—'}</Tag>
          },
          { title: 'Ghi chú', dataIndex: 'MoTa', render: renderMoTa },

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
    </>
  );

  const councilTypesTab = (
    <>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc nghiệp vụ"
          value={councilTypeKeyword}
          onChange={(event) => setCouncilTypeKeyword(event.target.value)}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCouncilType}>Tạo loại hội đồng</Button>
      </Space>

      <Table<CouncilType>
        rowKey="MaLoaiHoiDong"
        dataSource={filteredCouncilTypes}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Mã', dataIndex: 'MaLoaiHoiDong', width: 80 },
          { title: 'Tên loại hội đồng', dataIndex: 'TenLoaiHoiDong' },
          { title: 'Nghiệp vụ', dataIndex: 'NghiepVu', render: (value: CouncilBusiness) => businessOptions.find((option) => option.value === value)?.label || value },
          { title: 'Ghi chú', dataIndex: 'MoTa', render: renderMoTa },
          {
            title: 'Thao tác',
            width: 180,
            render: (_, type) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEditCouncilType(type)}>Sửa</Button>
                <Popconfirm
                  title="Xóa loại hội đồng này?"
                  description="Chỉ xóa được khi chưa có hội đồng sử dụng."
                  onConfirm={() => removeCouncilType(type.MaLoaiHoiDong)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </>
  );

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Tabs
        defaultActiveKey="requests"
        items={[
          { key: 'requests', label: 'Yêu cầu chờ xử lý', children: requestsTab },
          { key: 'councils', label: 'Danh sách hội đồng', children: councilsTab },
          { key: 'types', label: 'Loại hội đồng', children: councilTypesTab },
        ]}
      />

      <CouncilRequestDetailModal
        open={detailOpen}
        request={selectedRequest}
        councils={councils}
        approving={approving}
        rejecting={rejecting}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      <Modal title="Tạo hội đồng" open={councilOpen} onCancel={() => setCouncilOpen(false)} onOk={submitCouncil} okText="Tạo hội đồng" cancelText="Hủy" destroyOnClose>
        <Form form={councilForm} layout="vertical" initialValues={{ HinhThucHop: 'offline' }}>
          <Form.Item name="TenHoiDong" label="Tên hội đồng" rules={[{ required: true, message: 'Vui lòng nhập tên hội đồng' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="MaLoaiHoiDong" label="Loại hội đồng" rules={[{ required: true, message: 'Vui lòng chọn loại hội đồng' }]}>
            <Select
              placeholder="Chọn loại hội đồng"
              options={councilTypes.map((type) => ({ value: type.MaLoaiHoiDong, label: type.TenLoaiHoiDong }))}
            />
          </Form.Item>

          <Form.Item name="ThoiGianHop" label="Thời gian họp">
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn ngày giờ họp"
            />
          </Form.Item>

          <Form.Item name="HinhThucHop" label="Hình thức họp" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="offline">Họp trực tiếp</Radio.Button>
              <Radio.Button value="online">Họp online</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, curr) => prev.HinhThucHop !== curr.HinhThucHop} noStyle>
            {({ getFieldValue }) => {
              const hinhThuc: CouncilMeetingType = getFieldValue('HinhThucHop');
              if (hinhThuc === 'online') {
                return (
                  <Form.Item
                    name="LinkHop"
                    label="Link họp online"
                    rules={[{ required: true, message: 'Vui lòng nhập link họp' }]}
                  >
                    <Input placeholder="https://meet.google.com/xxx-xxxx-xxx" />
                  </Form.Item>
                );
              }
              return (
                <Form.Item
                  name="DiaDiem"
                  label="Địa điểm họp"
                  rules={[{ required: true, message: 'Vui lòng nhập địa điểm họp' }]}
                >
                  <Input placeholder="Ví dụ: Phòng họp A2, Học viện Nông nghiệp Việt Nam" />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="MoTa" label="Ghi chú thêm">
            <Input.TextArea rows={3} placeholder="Nội dung/ghi chú khác cho buổi họp (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCouncilType ? 'Chỉnh sửa loại hội đồng' : 'Tạo loại hội đồng'}
        open={councilTypeOpen}
        onCancel={() => {
          setCouncilTypeOpen(false);
          setEditingCouncilType(null);
        }}
        onOk={submitCouncilType}
        okText={editingCouncilType ? 'Lưu thay đổi' : 'Tạo loại'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={councilTypeForm} layout="vertical">
          <Form.Item name="TenLoaiHoiDong" label="Tên loại hội đồng" rules={[{ required: true, message: 'Vui lòng nhập tên loại hội đồng' }]}>
            <Input placeholder="Ví dụ: Hội đồng nghiệm thu cấp khoa" />
          </Form.Item>
          <Form.Item name="NghiepVu" label="Nghiệp vụ" rules={[{ required: true, message: 'Vui lòng chọn nghiệp vụ' }]}>
            <Select options={businessOptions} />
          </Form.Item>
          <Form.Item name="MoTa" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Mô tả thêm (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouncilList;

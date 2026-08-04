import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  approveCouncilRequest,
  createCouncilType,
  deleteCouncil,
  getCouncilRequests,
  getCouncils,
  rejectCouncilRequest,
} from '../../services/council/CouncilService';
import type {
  Council,
  CouncilAssignmentRequest,
  CouncilBusiness,
} from '../../services/council/CouncilService';
import CouncilRequestDetailModal from './CouncilRequestDetailModal';

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
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeForm] = Form.useForm();

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

  useEffect(() => {
    loadCouncils();
    loadRequests();
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

  const submitType = async () => {
    try {
      const values = await typeForm.validateFields();
      await createCouncilType(values);
      message.success('Đã thêm loại hội đồng');
      await loadCouncils();
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
          { title: 'Đề tài', render: (_, request) => request.DeTai?.TenDT || request.MaDT },
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
        <Button onClick={() => setTypeOpen(true)}>+ Thêm loại hội đồng</Button>
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
          { title: 'Loại hội đồng', render: (_, council) => <Tag>{council.LoaiHoiDong?.TenLoaiHoiDong || '—'}</Tag> },
          { title: 'Mô tả', dataIndex: 'MoTa', render: (value) => value || '—' },
          {
            title: "Năm hoạt động",
            render: (_: any, record: Council) => `${record.NamBatDau} - ${record.NamKetThuc}`,
            width: 150,
          },
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

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 6 }}>
      <Tabs
        defaultActiveKey="requests"
        items={[
          { key: 'requests', label: 'Yêu cầu chờ xử lý', children: requestsTab },
          { key: 'councils', label: 'Danh sách hội đồng', children: councilsTab },
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

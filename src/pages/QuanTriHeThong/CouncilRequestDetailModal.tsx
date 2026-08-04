import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button, Descriptions, Divider, Form, Input, InputNumber, List, Modal, Select, Tag, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type {
  CouncilRequest,
  CouncilType,
  ApproveCouncilRequestPayload,
} from '../../services/council/CouncilService';

const { TextArea } = Input;
const { Text, Link } = Typography;

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <>
    <Divider style={{ margin: '16px 0 12px' }} />
    <Text strong style={{ display: 'block', marginBottom: 8 }}>{children}</Text>
  </>
);

type ViewMode = 'detail' | 'approve' | 'reject';

const businessLabels: Record<string, string> = {
  approval: 'Xét duyệt đề tài',
  scoring: 'Nghiệm thu / chấm điểm',
  monitoring: 'Theo dõi',
  liquidation: 'Thanh lý',
  other: 'Khác',
};

const requestStatusTag = (status: CouncilRequest['TrangThai']) => {
  const map: Record<string, { color: string; label: string }> = {
    'Chờ duyệt': { color: 'blue', label: 'Chờ duyệt' },
    'Đã duyệt': { color: 'green', label: 'Đã duyệt' },
    'Từ chối': { color: 'red', label: 'Từ chối' },
  };
  const info = map[status] || { color: 'default', label: status };
  return <Tag color={info.color}>{info.label}</Tag>;
};

interface Props {
  open: boolean;
  request: CouncilRequest | null;
  types: CouncilType[];
  approving: boolean;
  rejecting: boolean;
  onClose: () => void;
  onAddType: () => void;
  onApprove: (payload: ApproveCouncilRequestPayload) => void;
  onReject: (reason: string) => void;
}

export default function CouncilRequestDetailModal({
  open,
  request,
  types,
  approving,
  rejecting,
  onClose,
  onAddType,
  onApprove,
  onReject,
}: Props) {
  const [view, setView] = useState<ViewMode>('detail');
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    if (open) {
      setView('detail');
      approveForm.resetFields();
      rejectForm.resetFields();
    }
  }, [open, request?.MaYeuCau, approveForm, rejectForm]);

  if (!request) return null;

  const isPending = request.TrangThai === 'Chờ duyệt';
  const matchingTypes = types.filter((type) => type.NghiepVu === request.LoaiHoiDong);

  const handleClose = () => {
    setView('detail');
    onClose();
  };

  const handleApproveSubmit = async () => {
    try {
      const values = await approveForm.validateFields();
      onApprove({
        TenHoiDong: values.TenHoiDong,
        MaLoaiHoiDong: values.MaLoaiHoiDong,
        NamBatDau: values.NamBatDau,
        NamKetThuc: values.NamKetThuc,
        MoTa: values.MoTa,
      });
    } catch {
      // lỗi validate đã hiển thị trên form
    }
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      onReject(values.LyDoTuChoi);
    } catch {
      // lỗi validate đã hiển thị trên form
    }
  };

  const renderDetail = () => (
    <>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Đề tài">{request.TenDT}</Descriptions.Item>
        <Descriptions.Item label="Mã đề tài">{request.MaDT}</Descriptions.Item>
        <Descriptions.Item label="Người gửi">{request.NguoiGui}</Descriptions.Item>
        <Descriptions.Item label="Ngày gửi">
          {new Date(request.NgayGui).toLocaleString('vi-VN')}
        </Descriptions.Item>
        <Descriptions.Item label="Loại hội đồng yêu cầu">
          <Tag color="purple">{businessLabels[request.LoaiHoiDong] || request.LoaiHoiDong}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{requestStatusTag(request.TrangThai)}</Descriptions.Item>
      </Descriptions>

      <SectionTitle>Lý do tạo</SectionTitle>
      <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
        {request.LyDo || 'Không có ghi chú'}
      </div>

      <SectionTitle>Tài liệu đính kèm</SectionTitle>
      {request.TaiLieu.length > 0 ? (
        <List
          size="small"
          dataSource={request.TaiLieu}
          renderItem={(doc) => (
            <List.Item>
              <FileTextOutlined style={{ marginRight: 8 }} />
              <Link href={doc.DuongDan} target="_blank" rel="noopener noreferrer">
                {doc.TenTaiLieu}
              </Link>
            </List.Item>
          )}
        />
      ) : (
        <Text type="secondary">Không có tài liệu đính kèm</Text>
      )}

      {request.TrangThai === 'Từ chối' && request.LyDoTuChoi && (
        <>
          <SectionTitle>Lý do từ chối</SectionTitle>
          <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
            {request.LyDoTuChoi}
          </div>
        </>
      )}
    </>
  );

  const renderApproveForm = () => (
    <Form form={approveForm} layout="vertical" initialValues={{ MoTa: request.LyDo }}>
      <Form.Item
        name="TenHoiDong"
        label="Tên hội đồng"
        rules={[{ required: true, message: 'Vui lòng nhập tên hội đồng' }]}
      >
        <Input placeholder="Ví dụ: Hội đồng xét duyệt CNTT đợt 1" />
      </Form.Item>

      <Form.Item
        name="MaLoaiHoiDong"
        label="Loại hội đồng"
        rules={[{ required: true, message: 'Vui lòng chọn loại hội đồng' }]}
      >
        <Select
          placeholder="Chọn loại hội đồng"
          options={matchingTypes.map((type) => ({ value: type.MaLoaiHoiDong, label: type.TenLoaiHoiDong }))}
          notFoundContent="Chưa có loại hội đồng phù hợp"
        />
      </Form.Item>
      <Button type="link" style={{ padding: 0, marginBottom: 16 }} onClick={onAddType}>
        + Thêm loại hội đồng mới
      </Button>

      <Form.Item label="Năm hoạt động" required style={{ marginBottom: 0 }}>
        <Form.Item
          name="NamBatDau"
          rules={[{ required: true, message: 'Nhập năm bắt đầu' }]}
          style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
        >
          <InputNumber placeholder="Năm bắt đầu" style={{ width: '100%' }} min={2000} max={2100} />
        </Form.Item>
        <Form.Item
          name="NamKetThuc"
          rules={[{ required: true, message: 'Nhập năm kết thúc' }]}
          style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: 16 }}
        >
          <InputNumber placeholder="Năm kết thúc" style={{ width: '100%' }} min={2000} max={2100} />
        </Form.Item>
      </Form.Item>

      <Form.Item name="MoTa" label="Mô tả">
        <TextArea rows={3} />
      </Form.Item>
    </Form>
  );

  const renderRejectForm = () => (
    <Form form={rejectForm} layout="vertical">
      <Form.Item
        name="LyDoTuChoi"
        label="Lý do từ chối"
        rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
      >
        <TextArea rows={4} placeholder="Nhập lý do từ chối yêu cầu này..." />
      </Form.Item>
    </Form>
  );

  const getTitle = () => {
    if (view === 'approve') return 'PHÊ DUYỆT YÊU CẦU TẠO HỘI ĐỒNG';
    if (view === 'reject') return 'TỪ CHỐI YÊU CẦU';
    return 'CHI TIẾT YÊU CẦU TẠO HỘI ĐỒNG';
  };

  const getFooter = () => {
    if (view === 'approve') {
      return [
        <Button key="back" onClick={() => setView('detail')}>Hủy</Button>,
        <Button key="submit" type="primary" loading={approving} onClick={handleApproveSubmit}>
          Phê duyệt
        </Button>,
      ];
    }
    if (view === 'reject') {
      return [
        <Button key="back" onClick={() => setView('detail')}>Hủy</Button>,
        <Button key="submit" danger type="primary" loading={rejecting} onClick={handleRejectSubmit}>
          Từ chối
        </Button>,
      ];
    }
    return [
      <Button key="close" onClick={handleClose}>Đóng</Button>,
      ...(isPending ? [
        <Button key="reject" danger onClick={() => setView('reject')}>Từ chối</Button>,
        <Button key="approve" type="primary" onClick={() => setView('approve')}>Phê duyệt</Button>,
      ] : []),
    ];
  };

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={handleClose}
      width={700}
      footer={getFooter()}
      destroyOnClose
    >
      {view === 'detail' && renderDetail()}
      {view === 'approve' && renderApproveForm()}
      {view === 'reject' && renderRejectForm()}
    </Modal>
  );
}

import { useEffect, useState } from 'react';
import { Button, Descriptions, Form, Input, Modal, Select, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { Council, CouncilAssignmentRequest } from '../../services/council/CouncilService';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  open: boolean;
  request: CouncilAssignmentRequest | null;
  councils: Council[];
  approving: boolean;
  rejecting: boolean;
  onClose: () => void;
  onApprove: (councilId: number) => void;
  onReject: (reason: string) => void;
}

export default function CouncilRequestDetailModal({
  open,
  request,
  councils,
  approving,
  rejecting,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const navigate = useNavigate();
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (open) {
      approveForm.resetFields();
      rejectForm.resetFields();
      setAction(null);
    }
  }, [open, request?.Id, approveForm, rejectForm]);

  if (!request) return null;

  const isPending = request.TrangThai === 'Chờ duyệt';
  const availableCouncils = councils.filter(
    (council) => council.MaLoaiHoiDong === request.MaLoaiHoiDong && council.ThanhVienHoiDong?.length,
  );

  const submitApprove = async () => {
    const values = await approveForm.validateFields();
    onApprove(values.MaHoiDong);
  };

  const submitReject = async () => {
    const values = await rejectForm.validateFields();
    onReject(values.LyDoTuChoi);
  };

  return (
    <Modal
      title="CHI TIẾT YÊU CẦU PHÂN CÔNG HỘI ĐỒNG"
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        !isPending
          ? [<Button key="close" onClick={onClose}>Đóng</Button>]
          : action === 'reject'
            ? [
              <Button key="back" onClick={() => setAction(null)}>Quay lại</Button>,
              <Button key="reject" danger type="primary" loading={rejecting} onClick={submitReject}>Xác nhận từ chối</Button>,
            ]
            : action === 'approve'
              ? [
                <Button key="back" onClick={() => setAction(null)}>Quay lại</Button>,
                <Button key="approve" type="primary" loading={approving} onClick={submitApprove}>Chấp nhận và gán hội đồng</Button>,
              ]
              : [
                <Button key="close" onClick={onClose}>Đóng</Button>,
                <Button key="reject" danger onClick={() => setAction('reject')}>Từ chối</Button>,
                <Button key="approve" type="primary" onClick={() => setAction('approve')}>Chấp nhận</Button>,
              ]
      }
      destroyOnClose
    >
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Đề tài">{request.DeTai?.TenDT || request.MaDT}</Descriptions.Item>
        <Descriptions.Item label="Mã đề tài">{request.MaDT}</Descriptions.Item>
        <Descriptions.Item label="Người gửi">{request.NguoiGui?.TenDayDu || request.TaiKhoanNguoiGui}</Descriptions.Item>
        <Descriptions.Item label="Loại hội đồng">{request.LoaiHoiDong?.TenLoaiHoiDong || `Loại #${request.MaLoaiHoiDong}`}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái"><Tag>{request.TrangThai}</Tag></Descriptions.Item>
        {request.HoiDong && <Descriptions.Item label="Hội đồng đã gán">{request.HoiDong.TenHoiDong}</Descriptions.Item>}
      </Descriptions>

      <Button style={{ marginTop: 12 }} onClick={() => navigate(`/mainhome/topic/${request.MaDT}`)}>
        Xem chi tiết và tài liệu đề tài
      </Button>

      <p style={{ marginTop: 16 }}><Text strong>Nội dung yêu cầu</Text></p>
      <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
        {request.LyDoYeuCau || 'Không có ghi chú'}
      </div>

      {request.LyDoTuChoi && <>
        <p style={{ marginTop: 16 }}><Text strong>Lý do từ chối</Text></p>
        <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4 }}>{request.LyDoTuChoi}</div>
      </>}

      {isPending && action === 'approve' && (
        <Form form={approveForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="MaHoiDong" label="Hội đồng để phân công" rules={[{ required: true, message: 'Vui lòng chọn hội đồng' }]}>
            <Select
              placeholder="Chọn hội đồng đã có thành viên"
              options={availableCouncils.map((council) => ({
                value: council.MaHoiDong,
                label: `${council.TenHoiDong} (${council.ThanhVienHoiDong?.length || 0} thành viên)`,
              }))}
              notFoundContent="Chưa có hội đồng phù hợp hoặc hội đồng chưa có thành viên"
            />
          </Form.Item>
        </Form>
      )}
      {isPending && action === 'reject' && (
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="LyDoTuChoi" label="Lý do từ chối" rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}>
            <TextArea rows={3} placeholder="Lý do sẽ gửi cho nhóm trưởng" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

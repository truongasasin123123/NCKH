import { Button, Input, Modal } from 'antd';
import type { ReviewerApproval } from './types';

interface ResendApprovalModalProps {
  open: boolean;
  target: ReviewerApproval | null;
  note: string;
  onChangeNote: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ResendApprovalModal({ open, target, note, onChangeNote, onClose, onSubmit }: ResendApprovalModalProps) {
  return (
    <Modal
      title={`GỬI LẠI CHO ${target?.name?.toUpperCase() || ''}`}
      open={open}
      onCancel={onClose}
      footer={[<Button key="cancel" danger onClick={onClose}>Đóng</Button>, <Button key="submit" type="primary" onClick={onSubmit}>Gửi lại</Button>]}
      width={600}
    >
      {target && <div>
        <p><strong>Người nhận:</strong> {target.name} ({target.account})</p>
        {target.note && <p style={{ color: '#cf1322' }}><strong>Lý do từ chối trước đó:</strong> {target.note}</p>}
        <p style={{ fontWeight: 'bold' }}>Ghi chú (Tùy chọn):</p>
        <Input.TextArea rows={4} value={note} onChange={(event) => onChangeNote(event.target.value)} placeholder="Nhập ghi chú giải thích lý do gửi lại..." />
      </div>}
    </Modal>
  );
}

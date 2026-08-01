import { Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface ApprovalReviewActionsProps {
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export default function ApprovalReviewActions({ canReview, onApprove, onReject }: ApprovalReviewActionsProps) {
  if (!canReview) return null;

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Button type="primary" icon={<CheckCircleOutlined />} block onClick={onApprove}>Phê duyệt đề tài</Button>
    <Button danger icon={<CloseCircleOutlined />} block onClick={onReject}>Từ chối phê duyệt</Button>
  </div>;
}

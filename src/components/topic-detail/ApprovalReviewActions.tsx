import { Button, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MessageOutlined } from '@ant-design/icons';

interface ApprovalReviewActionsProps {
  canReview: boolean;
  hasCommented?: boolean;
  onApprove: () => void;
  onReject: () => void;
  approveText?: string;
  rejectText?: string;
  onScrollToComments?: () => void;
}

export default function ApprovalReviewActions({
  canReview,
  hasCommented = true,
  onApprove,
  onReject,
  approveText,
  rejectText,
  onScrollToComments,
}: ApprovalReviewActionsProps) {
  if (!canReview) return null;

  if (!hasCommented) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Alert
          type="warning"
          showIcon
          icon={<MessageOutlined />}
          message={<span style={{ fontWeight: 600 }}>Cần nhận xét trước khi phê duyệt</span>}
          description={
            <div style={{ marginTop: 4, fontSize: 13 }}>
              <div>Thành viên hội đồng cần gửi nhận xét đánh giá đề tài trước khi thực hiện phê duyệt hoặc từ chối.</div>
              {onScrollToComments && (
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, fontWeight: 500 }}
                    onClick={onScrollToComments}
                  >
                    Viết nhận xét ngay &darr;
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        block
        onClick={onApprove}
      >
        {approveText || 'Phê duyệt đề tài'}
      </Button>
      <Button
        danger
        icon={<CloseCircleOutlined />}
        block
        onClick={onReject}
      >
        {rejectText || 'Từ chối phê duyệt'}
      </Button>
    </div>
  );
}

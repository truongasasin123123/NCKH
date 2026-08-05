import type { ReactNode } from 'react';
import type { CollapseProps } from 'antd';
import { Button, Card, Collapse, List, Tag } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { ReviewerApproval } from './types';

interface CouncilPanelProps {
  reviewers: ReviewerApproval[];
  history: ReviewerApproval[];
  approvedCount: number;
  totalReviewers: number;
  isTopicLeader: boolean;
  canOpenAcceptance: boolean;
  acceptanceItems: CollapseProps['items'];
  onResend: (reviewer: ReviewerApproval) => void;
  onOpenAcceptance: () => void;
  renderStatus: (status: string) => ReactNode;
}

export default function CouncilPanel({
  reviewers,
  history,
  approvedCount,
  totalReviewers,
  isTopicLeader,
  canOpenAcceptance,
  acceptanceItems,
  onResend,
  onOpenAcceptance,
  renderStatus,
}: CouncilPanelProps) {
  return (
    <>
      <Card title="Trạng thái phê duyệt">
        {reviewers.length ? (
          <>
            <p><strong>Hội đồng xét duyệt đã đồng ý:</strong> {approvedCount}/{totalReviewers}</p>
            <List
              dataSource={reviewers}
              renderItem={(reviewer, index) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                    <div>
                      {index + 1}. {reviewer.name}
                      <Tag style={{ marginLeft: 8 }} color={reviewer.councilType === 'Xét duyệt' ? 'purple' : 'cyan'}>
                        Hội đồng {reviewer.councilType.toLowerCase()}
                      </Tag>
                                      {reviewer.name !== reviewer.account && (
                        <span style={{ color: '#8c8c8c' }}>
                          ({reviewer.account})
                        </span>
                      )}
                      {reviewer.responseDate && (
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                          Phản hồi: {new Date(reviewer.responseDate).toLocaleString('vi-VN')}
                        </div>
                      )}
                      {reviewer.status === 'Từ chối' && reviewer.note && (
                        <div
                          style={{
                            color: '#cf1322',
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          Lý do từ chối: {reviewer.note}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {reviewer.status === 'Từ chối' && isTopicLeader && (
                        <Button
                          type="primary"
                          className="btn-see-upload"
                          icon={<SendOutlined />}
                          onClick={() => onResend(reviewer)}
                        >
                          Gửi lại
                        </Button>
                      )}
                      {renderStatus(reviewer.status)}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </>
        ) : (
        <p>
          Chưa có trạng thái phê duyệt nào. Vui lòng gửi cho hội đồng để được phê duyệt.
        </p>
      )}
      </Card>

      {history.length > 0 && (
        <Card title="Lịch sử phản hồi xét duyệt" size="small" style={{ marginTop: 16 }}>
          <List
            dataSource={history}
            renderItem={(reviewer) => (
              <List.Item>
                <div>
                  <strong>{reviewer.name}</strong> {renderStatus(reviewer.status)}
                  {reviewer.note && <div style={{ color: '#cf1322', marginTop: 4 }}>Lý do: {reviewer.note}</div>}
                  {reviewer.responseDate && <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>Phản hồi lúc: {new Date(reviewer.responseDate).toLocaleString('vi-VN')}</div>}
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card
        title="Tổng hợp điểm"
        style={{ marginTop: 16, marginBottom: 24 }}
        extra={isTopicLeader && canOpenAcceptance ? <Button type="primary" onClick={onOpenAcceptance}>Hồ sơ nghiệm thu</Button> : null}
      >
        <Collapse items={acceptanceItems} defaultActiveKey={['hoidong-cham']} />
      </Card>
    </>
  );
}

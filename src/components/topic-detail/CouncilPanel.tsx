import { useMemo, useState, type ReactNode } from 'react';
import type { CollapseProps } from 'antd';
import { Button, Card, Collapse, List, Tag, Input, Select, Space, Empty } from 'antd';
import { DownloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import type { ProjectDocumentItem, ReviewerApproval } from './types';
import type { DocumentQueryParams } from '../../services/topic/DocumentsService';


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
  // --- thêm mới: dữ liệu tài liệu dự án ---
  documents: ProjectDocumentItem[];
  documentsLoading: boolean;
  visibleDocumentCount: number;
  onShowMoreDocuments: () => void;
  onDownloadDocument: (id: number, name: string) => void;
  onFilterDocuments: (query: DocumentQueryParams) => void;
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
  documents,
  documentsLoading,
  visibleDocumentCount,
  onShowMoreDocuments,
  onDownloadDocument,
  onFilterDocuments,
}: CouncilPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);

  const sourceOptions = useMemo(() => {
    const sources = Array.from(
      new Set(documents.map((doc) => doc.source).filter(Boolean)),
    );
    return sources.map((source) => ({ label: source, value: source }));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = searchText.trim()
        ? doc.name.toLowerCase().includes(searchText.trim().toLowerCase())
        : true;
      const matchesSource = sourceFilter ? doc.source === sourceFilter : true;
      return matchesSearch && matchesSource;
    });
  }, [documents, searchText, sourceFilter]);

  const isFiltering = searchText.trim() !== '' || !!sourceFilter;

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

      <Card title="Tổng hợp tài liệu dự án" style={{ marginTop: 16 }}>
        {documents.length > 0 && (
          <Space style={{ width: '100%', marginBottom: 16 }} direction="horizontal" wrap>
            <Input.Search
              allowClear
              placeholder="Tìm kiếm theo tên tài liệu..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                const value = e.target.value;
                setSearchText(value);
                if (!value) {
                  onFilterDocuments({ source: sourceFilter });
                }
              }}
              onSearch={(value) => onFilterDocuments({
                keyword: value.trim() || undefined,
                source: sourceFilter,
              })}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Lọc theo nguồn"
              options={sourceOptions}
              value={sourceFilter}
              onChange={(value) => {
                setSourceFilter(value);
                onFilterDocuments({
                  keyword: searchText.trim() || undefined,
                  source: value,
                });
              }}
              style={{ width: 200 }}
            />
          </Space>
        )}

        {documentsLoading ? (
          <p>Đang tải tài liệu...</p>
        ) : documents.length > 0 ? (
          <>
            {filteredDocuments.length > 0 ? (
              <List
                dataSource={isFiltering ? filteredDocuments : filteredDocuments.slice(0, visibleDocumentCount)}
                renderItem={(document) => (
                  <List.Item>
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                      }}
                    >
                      <div>
                        <strong>{document.name}</strong>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          <Tag style={{ marginRight: 4 }}>{document.source}</Tag>
                          {document.date ? document.date : ''}
                        </div>
                      </div>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        className="btn-see-upload"
                        onClick={() => onDownloadDocument(document.id, document.name)}
                      >
                        Tải xuống
                      </Button>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Không tìm thấy tài liệu phù hợp" />
            )}

            {!isFiltering && documents.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button block onClick={onShowMoreDocuments}>
                  {visibleDocumentCount >= documents.length
                    ? 'Thu gọn tài liệu'
                    : `Xem tất cả tài liệu (${documents.length - visibleDocumentCount} còn lại)`}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p>Chưa có tài liệu dự án từ tiến độ.</p>
        )}
      </Card>

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

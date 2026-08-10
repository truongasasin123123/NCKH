import { useMemo, useState } from 'react';
import { Button, Card, List, Input, Select, Space, Empty, Tag } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ThanhVienDT, TopicLoad } from '../../services/topic/TopicService';
import type { ProjectDocumentItem } from './types';
import type { DocumentQueryParams } from '../../services/topic/DocumentsService';

interface TopicInformationPanelProps {
  topic: TopicLoad;
  members: ThanhVienDT[];
  documents: ProjectDocumentItem[];
  documentsLoading: boolean;
  visibleDocumentCount: number;
  onShowMoreDocuments: () => void;
  onDownloadDocument: (id: number, name: string) => void;
  onFilterDocuments: (query: DocumentQueryParams) => void;
}

export default function TopicInformationPanel({
  topic,
  members,
  documents,
  documentsLoading,
  visibleDocumentCount,
  onShowMoreDocuments,
  onDownloadDocument,
  onFilterDocuments,
}: TopicInformationPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);

  // Danh sách nguồn tài liệu duy nhất để đổ vào bộ lọc
  const sourceOptions = useMemo(() => {
    const sources = Array.from(
      new Set(documents.map((doc) => doc.source).filter(Boolean)),
    );
    return sources.map((source) => ({ label: source, value: source }));
  }, [documents]);

  // Áp dụng tìm kiếm + lọc trước khi cắt theo visibleDocumentCount
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
      <Card title="Thông tin cơ bản">
        <p>
          <strong>Mã đề tài:</strong> #{topic.MaDT}
        </p>
        <p>
          <strong>Danh mục:</strong> {topic.PhanLoai}
        </p>
        <p>
          <strong>Ngày bắt đầu:</strong>{' '}
          {topic.NgayBatDau ? new Date(topic.NgayBatDau).toLocaleDateString('vi-VN') : '-'}
        </p>
        <p>
          <strong>Hạn chót:</strong>{' '}
          {topic.NgayKetThuc ? new Date(topic.NgayKetThuc).toLocaleDateString('vi-VN') : '-'}
        </p>
      </Card>

      <Card title="Mô tả" style={{ marginTop: 16 }}>
        <p>{topic.MoTa || 'Chưa có mô tả'}</p>
      </Card>

      <Card title="Tổng hợp tài liệu dự án" style={{ marginTop: 16 }}>
        {documents.length > 0 && (
          <Space
            style={{ width: '100%', marginBottom: 16 }}
            direction="horizontal"
            wrap
          >
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
                dataSource={
                  isFiltering
                    ? filteredDocuments
                    : filteredDocuments.slice(0, visibleDocumentCount)
                }
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

      <Card title="Thành viên nhóm" style={{ marginTop: 16 }}>
        {members.length ? (
          <List
            dataSource={members}
            renderItem={(member, index) => (
              <List.Item>{index + 1}. {member.TaiKhoan} - {member.VaiTroDT}</List.Item>
            )}
          />
        ) : <p>Chưa có thành viên</p>}
      </Card>
    </>
  );
}

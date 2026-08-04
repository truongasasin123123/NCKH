import { Button, Card, List } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ThanhVienDT, TopicLoad } from '../../services/topic/TopicService';
import type { ProjectDocumentItem } from './types';

interface TopicInformationPanelProps {
  topic: TopicLoad;
  members: ThanhVienDT[];
  documents: ProjectDocumentItem[];
  documentsLoading: boolean;
  visibleDocumentCount: number;
  onShowMoreDocuments: () => void;
  onDownloadDocument: (id: number, name: string) => void;
}

export default function TopicInformationPanel({
  topic,
  members,
  documents,
  documentsLoading,
  visibleDocumentCount,
  onShowMoreDocuments,
  onDownloadDocument,
}: TopicInformationPanelProps) {
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
        {documentsLoading ? (
          <p>Đang tải tài liệu...</p>
        ) : documents.length > 0 ? (
          <>
            <List
              dataSource={documents.slice(0, visibleDocumentCount)}
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
                        {document.source}
                        {document.date ? ` · ${document.date}` : ''}
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
            {visibleDocumentCount < documents.length && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button block onClick={onShowMoreDocuments}>
                  Tải thêm tài liệu ({documents.length - visibleDocumentCount} còn lại)
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

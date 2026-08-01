import React from 'react';
import { Button, Collapse, Space, Tag } from 'antd';
import { SendOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { BaoCaoTienDo } from '../../services/progress/ProgressService';

interface BaoCaoTabProps {
  canManageMoc: boolean;
  baoCaoList: BaoCaoTienDo[];
  baoCaoLoading: boolean;
  submittingBaoCao: boolean;
  onOpenCreate: () => void;
  onEdit: (report: BaoCaoTienDo) => void;
  onDelete: (report: BaoCaoTienDo) => void;
  onDeleteDocument: (documentId: number) => void;
  onSubmitExisting: (reportId: number) => void;
  downloadDocument: (maTL: number, tenFile: string) => void;
}

/**
 * Danh sách báo cáo tiến độ của đề tài (dạng Collapse), kèm thao tác
 * tạo / sửa / xóa / gửi báo cáo và quản lý tài liệu minh chứng.
 */
const BaoCaoTab: React.FC<BaoCaoTabProps> = ({
  canManageMoc, baoCaoList, baoCaoLoading, submittingBaoCao,
  onOpenCreate, onEdit, onDelete, onDeleteDocument, onSubmitExisting, downloadDocument,
}) => {
  return (
    <>
      {canManageMoc && (
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onOpenCreate}
          style={{ marginBottom: 16 }}
        >
          Tạo báo cáo tiến độ
        </Button>
      )}

      <Collapse
        items={baoCaoList.map((bc) => ({
          key: bc.Id,
          label: (
            <Space size="middle">
              <span style={{ fontWeight: 500 }}>{bc.KyBaoCao}</span>
              <Tag color={bc.LoaiBaoCao === 'Theo mốc' ? 'blue' : 'purple'}>{bc.LoaiBaoCao}</Tag>
              <span>{bc.TienDoBaoCao}%</span>
              <span style={{ color: '#888' }}>
                {bc.NgayGui ? dayjs(bc.NgayGui).format('DD/MM/YYYY') : 'Chưa gửi'}
              </span>
              <Tag color={
                bc.TrangThai === 'Đạt' ? 'success' :
                  bc.TrangThai === 'Đã gửi' ? 'processing' :
                    bc.TrangThai === 'Không đạt' ? 'error' : 'warning'
              }>
                {bc.TrangThai}
              </Tag>
            </Space>
          ),
          children: (
            <div>
              <p><strong>Nội dung:</strong> {bc.NoiDungBaoCao}</p>
              <p><strong>Khó khăn:</strong> {bc.KhoKhan || '—'}</p>
              <p><strong>Đề xuất:</strong> {bc.DeXuat || '—'}</p>
              {bc.NhanXetHoiDong && (
                <p><strong>Nhận xét hội đồng:</strong> {bc.NhanXetHoiDong}</p>
              )}
              {bc.PhanHoi?.length ? (
                <div style={{ marginBottom: 12 }}>
                  <strong>Lịch sử phản hồi:</strong>
                  {bc.PhanHoi.map((feedback) => (
                    <div key={feedback.Id} style={{ marginTop: 6, padding: '8px 10px', background: '#fafafa', borderRadius: 4 }}>
                      <Tag color={feedback.KetQua === 'Đạt' ? 'success' : feedback.KetQua === 'Không đạt' ? 'error' : 'warning'}>{feedback.KetQua}</Tag>
                      {feedback.NhanXet} <span style={{ color: '#888' }}>— {dayjs(feedback.NgayPhanHoi).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ marginTop: 16, marginBottom: 12 }}>
                <strong>Minh chứng</strong>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>Tài liệu đính kèm của hồ sơ báo cáo</div>
              </div>
              {bc.TaiLieu?.length ? (
                <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
                  {bc.TaiLieu.map((document) => (
                    <div key={document.MaTL} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 10px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                      <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left', whiteSpace: 'normal' }} onClick={() => downloadDocument(document.MaTL, document.TenFile)}>{document.TenFile}</Button>
                      {['Nháp', 'Yêu cầu bổ sung'].includes(bc.TrangThai) && <Button danger size="small" type="text" onClick={() => onDeleteDocument(document.MaTL)}>Xóa</Button>}
                    </div>
                  ))}
                </Space>
              ) : <p>Chưa có tài liệu minh chứng.</p>}
              {['Nháp', 'Yêu cầu bổ sung'].includes(bc.TrangThai) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
                  <Space wrap>
                    <Button onClick={() => onEdit(bc)}>Chỉnh sửa</Button>
                    {bc.TrangThai === 'Nháp' && <Button danger type="text" onClick={() => onDelete(bc)}>Xóa báo cáo</Button>}
                  </Space>
                  <Button type="primary" icon={<SendOutlined />} loading={submittingBaoCao} onClick={() => onSubmitExisting(bc.Id)}>
                    {bc.TrangThai === 'Yêu cầu bổ sung' ? 'Gửi lại báo cáo' : 'Gửi báo cáo'}
                  </Button>
                </div>
              )}
            </div>
          ),
        }))}
      />
      {!baoCaoLoading && baoCaoList.length === 0 && <div>Chưa có báo cáo nào</div>}
    </>
  );
};

export default BaoCaoTab;

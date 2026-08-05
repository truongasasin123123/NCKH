import { Button, Divider, Input, Modal, Tag, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TopicLoad } from '../../services/topic/TopicService';

interface Props {
  topic: TopicLoad | null;
  open: boolean;
  isResubmission: boolean;
  note: string;
  files: UploadFile[];
  onNoteChange: (value: string) => void;
  onFilesChange: (files: UploadFile[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ApprovalSubmitModal({
  topic,
  open,
  isResubmission,
  note,
  files,
  onNoteChange,
  onFilesChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal
      title={
        isResubmission
          ? 'GỬI LẠI PHIẾU XÉT DUYỆT'
          : 'GỬI ĐỀ TÀI LÊN HỘI ĐỒNG ĐÁNH GIÁ'
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" danger onClick={onClose}>
          Đóng
        </Button>,
        <Button key="submit" type="primary" onClick={onSubmit}>
          Gửi
        </Button>,
      ]}
    >
      {topic && (
        <>
          <p>
            <strong>Tên đề tài:</strong> {topic.TenDT}
          </p>
          <p>
            <strong>Danh mục:</strong> {topic.PhanLoai}
          </p>
          <p>
            <strong>Trạng thái:</strong> {topic.TrangThai}
          </p>

          <Divider />

          <p>
            <strong>Mô tả:</strong>
          </p>
          <div
            style={{
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {topic.MoTa}
          </div>

          <Divider />

          <p>
            <strong>Loại hội đồng:</strong>{' '}
            <Tag color="purple">Hội đồng xét duyệt</Tag>
          </p>
          <p>
            {isResubmission
              ? 'Hệ thống chỉ gửi lại cho các thành viên đã từ chối ở vòng trước.'
              : 'Hệ thống sẽ tự động gửi đến toàn bộ thành viên của hội đồng xét duyệt.'}
          </p>

          <p>
            <strong>Ghi chú (tùy chọn):</strong>
          </p>
          <Input.TextArea
            rows={5}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />

          <Divider />

          <p>
            <strong>Đính kèm tài liệu:</strong>
          </p>
          <Upload
            listType="picture"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.pptx"
            onChange={(info) => onFilesChange(info.fileList)}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Chọn tệp</Button>
          </Upload>

          {files.length > 0 && (
            <p style={{ marginTop: 12 }}>
              Số tệp đã chọn: {files.length}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

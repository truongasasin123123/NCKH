import { useEffect } from 'react';
import { Button, Form, Input, Modal, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TopicLoad } from '../../services/topic/TopicService';

const { TextArea } = Input;

export type CouncilType = 'approval' | 'scoring';

interface Props {
  topic: TopicLoad | null;
  open: boolean;
  isResubmission: boolean;
  councilType: CouncilType;
  note: string;
  files: UploadFile[];
  onCouncilTypeChange: (value: CouncilType) => void;
  onNoteChange: (value: string) => void;
  onFilesChange: (files: UploadFile[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const COUNCIL_TYPE_OPTIONS: { label: string; value: CouncilType }[] = [
  { label: 'Hội đồng xét duyệt', value: 'approval' },
  { label: 'Hội đồng nghiệm thu', value: 'scoring' },
];

export default function CouncilCreateModal({
  topic,
  open,
  isResubmission,
  councilType,
  note,
  files,
  onCouncilTypeChange,
  onNoteChange,
  onFilesChange,
  onClose,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ councilType, note });
    }
  }, [open, councilType, note, form]);

  const handleSend = async () => {
    try {
      await form.validateFields();
      onSubmit();
    } catch {
      // lỗi validate đã hiển thị trên form, không cần xử lý thêm
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isResubmission ? 'GỬI LẠI YÊU CẦU HỘI ĐỒNG' : 'TẠO HỘI ĐỒNG'}
      open={open}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSend}>
          Gửi
        </Button>,
      ]}
    >
      {topic && (
        <>
          <p><strong>Tên đề tài:</strong> {topic.TenDT}</p>
          <p><strong>Danh mục:</strong> {topic.PhanLoai}</p>
          <p><strong>Trạng thái:</strong> {topic.TrangThai}</p>
          
          <Form form={form} layout="vertical" initialValues={{ councilType, note }}>
            <Form.Item
              label="Loại hội đồng"
              name="councilType"
              rules={[{ required: true, message: 'Vui lòng chọn loại hội đồng' }]}
            >
              <Select
                options={COUNCIL_TYPE_OPTIONS}
                disabled={isResubmission}
                onChange={(value: CouncilType) => onCouncilTypeChange(value)}
              />
            </Form.Item>

            {isResubmission && (
              <p style={{ marginTop: -12, color: '#8c8c8c' }}>
                Hệ thống chỉ gửi lại cho các thành viên hội đồng đã từ chối ở vòng trước.
              </p>
            )}

            <Form.Item
              label="Lý do tạo"
              name="note"
              rules={[{ required: true, message: 'Vui lòng nhập lý do tạo hội đồng' }]}
            >
              <TextArea
                rows={5}
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Nhập lý do gửi đề tài đến hội đồng..."
              />
            </Form.Item>

            <Form.Item label="Đính kèm tài liệu">
              <Upload
                listType="picture"
                multiple
                fileList={files}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.pptx"
                onChange={(info) => onFilesChange(info.fileList)}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Chọn tệp</Button>
              </Upload>
              {files.length > 0 && (
                <p style={{ marginTop: 12, marginBottom: 0 }}>Số tệp đã chọn: {files.length}</p>
              )}
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

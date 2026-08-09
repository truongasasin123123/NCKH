import { useState } from "react";
import { Modal, Form, Input, Tag, Upload, App } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;

export interface AdjustmentRequestPayload {
  ghiChu: string;
  files: UploadFile[];
}

interface AdjustmentRequestModalProps {
  open: boolean;
  topicCode: string;
  reasonFromChair?: string; // hiển thị lại lý do Chủ tịch đã ghi khi yêu cầu điều chỉnh
  onClose: () => void;
  // TODO: nối API thật khi backend có endpoint POST /adjustment-requests
  onSubmit: (topicCode: string, payload: AdjustmentRequestPayload) => Promise<void>;
}

const AdjustmentRequestModal: React.FC<AdjustmentRequestModalProps> = ({
  open,
  topicCode,
  reasonFromChair,
  onClose,
  onSubmit,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit(topicCode, { ghiChu: values.ghiChu, files });
      message.success("Đã gửi phiếu điều chỉnh, chờ admin phê duyệt");
      form.resetFields();
      setFiles([]);
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      console.error("Lỗi khi gửi phiếu điều chỉnh:", error);
      message.error("Gửi phiếu điều chỉnh thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Tạo phiếu điều chỉnh đề tài"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Gửi cho admin duyệt"
      cancelText="Hủy"
      width={600}
    >
      {reasonFromChair && (
        <div style={{ marginBottom: 16, padding: 12, background: "#fff7e6", borderRadius: 6 }}>
          <Tag color="red">Yêu cầu từ Chủ tịch hội đồng</Tag>
          <div style={{ marginTop: 6 }}>{reasonFromChair}</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="ghiChu"
          label="Ghi chú điều chỉnh"
          rules={[{ required: true, message: "Nhập nội dung điều chỉnh" }]}
        >
          <TextArea
            rows={5}
            placeholder="Mô tả nội dung/tiến độ/kinh phí cần điều chỉnh và lý do..."
          />
        </Form.Item>

        <Form.Item label="Tài liệu đính kèm">
          <Dragger
            multiple
            fileList={files}
            beforeUpload={() => false}
            onChange={({ fileList }) => setFiles(fileList)}
            onRemove={(file) => setFiles((current) => current.filter((f) => f.uid !== file.uid))}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc bấm để chọn tài liệu</p>
            <p className="ant-upload-hint">Có thể chọn nhiều tài liệu cùng lúc</p>
          </Dragger>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdjustmentRequestModal;
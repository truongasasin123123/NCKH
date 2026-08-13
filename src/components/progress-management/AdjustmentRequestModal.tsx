import { useState } from "react";
import { Modal, Form, Input, Select, Tag, Upload, App } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Dragger } = Upload;

const ADJUSTMENT_GROUP_OPTIONS = [
  { label: "Nội dung nghiên cứu", value: "noi_dung" },
  { label: "Tiến độ thực hiện", value: "tien_do" },
  { label: "Sản phẩm dự kiến", value: "san_pham" },
  { label: "Kinh phí", value: "kinh_phi" },
  { label: "Nhân sự", value: "nhan_su" },
];

export type AdjustmentApprovalStatus = "cho_duyet" | "da_duyet" | "tu_choi";

export interface AdjustmentRequestPayload {
  noiDungHienTai: string;
  noiDungDeNghi: string;
  nhomDieuChinh: string[];
  lyDo: string;
  files: UploadFile[];
}

interface AdjustmentRequestModalProps {
  open: boolean;
  topicCode: string;
  reasonFromChair?: string; // ý kiến Chủ tịch khi yêu cầu điều chỉnh
  approvalStatus?: AdjustmentApprovalStatus; // trạng thái duyệt của Admin (chỉ có khi xem lại phiếu đã gửi)
  adminNote?: string; // ghi chú của Admin khi duyệt/từ chối (nếu có)
  onClose: () => void;
  // TODO: nối API thật khi backend có endpoint POST /adjustment-requests
  onSubmit: (topicCode: string, payload: AdjustmentRequestPayload) => Promise<void>;
}

const APPROVAL_STATUS_LABEL: Record<AdjustmentApprovalStatus, { text: string; color: string }> = {
  cho_duyet: { text: "Chờ Admin duyệt", color: "blue" },
  da_duyet: { text: "Đã duyệt", color: "green" },
  tu_choi: { text: "Từ chối", color: "red" },
};

const AdjustmentRequestModal: React.FC<AdjustmentRequestModalProps> = ({
  open,
  topicCode,
  reasonFromChair,
  approvalStatus,
  adminNote,
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
      await onSubmit(topicCode, { ...values, files });
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
      title="Phiếu điều chỉnh đề tài"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Gửi cho admin duyệt"
      cancelText="Hủy"
      width={640}
    >
      {approvalStatus && (
        <div style={{ marginBottom: 16 }}>
          <Tag color={APPROVAL_STATUS_LABEL[approvalStatus].color}>
            {APPROVAL_STATUS_LABEL[approvalStatus].text}
          </Tag>
          {adminNote && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#595959" }}>
              <b>Ghi chú của Admin:</b> {adminNote}
            </div>
          )}
        </div>
      )}

      {reasonFromChair && (
        <div style={{ marginBottom: 16, padding: 12, background: "#fff7e6", borderRadius: 6 }}>
          <Tag color="red">Ý kiến Chủ tịch hội đồng</Tag>
          <div style={{ marginTop: 6 }}>{reasonFromChair}</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="nhomDieuChinh"
          label="Nhóm điều chỉnh"
          rules={[{ required: true, message: "Chọn ít nhất một nhóm điều chỉnh" }]}
        >
          <Select mode="multiple" options={ADJUSTMENT_GROUP_OPTIONS} placeholder="Chọn nội dung/tiến độ/sản phẩm/kinh phí/nhân sự" />
        </Form.Item>

        <Form.Item
          name="noiDungHienTai"
          label="Nội dung hiện tại"
          rules={[{ required: true, message: "Nhập nội dung hiện tại" }]}
        >
          <TextArea rows={3} placeholder="Mô tả nội dung/tiến độ/kinh phí/nhân sự hiện tại theo thuyết minh..." />
        </Form.Item>

        <Form.Item
          name="noiDungDeNghi"
          label="Nội dung đề nghị điều chỉnh"
          rules={[{ required: true, message: "Nhập nội dung đề nghị điều chỉnh" }]}
        >
          <TextArea rows={3} placeholder="Mô tả nội dung mới muốn thay đổi..." />
        </Form.Item>

        <Form.Item
          name="lyDo"
          label="Lý do điều chỉnh"
          rules={[{ required: true, message: "Nhập lý do" }]}
        >
          <TextArea rows={3} placeholder="Giải trình lý do cần điều chỉnh..." />
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
import { useState } from "react";
import { Modal, Radio, Form, Input, DatePicker, Checkbox, Space, Tag, App } from "antd";
import type { RadioChangeEvent } from "antd";
import { nhanXetBaoCao } from "../../services/progress/ProgressService";

const { TextArea } = Input;

type Conclusion = "dat" | "yeu_cau_bo_sung" | "yeu_cau_dieu_chinh";

const ADJUSTMENT_TYPE_OPTIONS = [
  { label: "Nội dung nghiên cứu", value: "noi_dung" },
  { label: "Tiến độ thực hiện", value: "tien_do" },
  { label: "Sản phẩm dự kiến", value: "san_pham" },
  { label: "Kinh phí", value: "kinh_phi" },
];

interface ReportConclusionModalProps {
  open: boolean;
  reportId: number;
  onClose: () => void;
  onSuccess: () => void; // gọi lại để refetch danh sách báo cáo
  // Chưa có API thật cho "yêu cầu điều chỉnh" -> truyền callback riêng để cha xử lý (VD: lưu tạm, gọi API khi có)
  onRequestAdjustment?: (payload: {
    reportId: number;
    reason: string;
    adjustmentTypes: string[];
    dueDate: string | null;
  }) => void;
}

const ReportConclusionModal: React.FC<ReportConclusionModalProps> = ({
  open,
  reportId,
  onClose,
  onSuccess,
  onRequestAdjustment,
}) => {
  const { message } = App.useApp();
  const [conclusion, setConclusion] = useState<Conclusion>("dat");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleChangeConclusion = (e: RadioChangeEvent) => {
    setConclusion(e.target.value);
    form.resetFields(["content", "dueDate", "adjustmentReason", "adjustmentTypes"]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (conclusion === "dat") {
        await nhanXetBaoCao(reportId, "accepted", values.content || "Báo cáo đạt yêu cầu");
        message.success("Đã kết luận: Đạt");
      } else if (conclusion === "yeu_cau_bo_sung") {
        await nhanXetBaoCao(reportId, "supplement", values.content);
        message.success("Đã yêu cầu bổ sung. Nhóm trưởng có thể nộp lại báo cáo này.");
      } else if (conclusion === "yeu_cau_dieu_chinh") {
        // TODO: nối API thật khi backend có endpoint tạo phiếu điều chỉnh
        onRequestAdjustment?.({
          reportId,
          reason: values.adjustmentReason,
          adjustmentTypes: values.adjustmentTypes || [],
          dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        });
        message.success("Đã ghi nhận yêu cầu điều chỉnh. Nhóm trưởng sẽ tạo phiếu gửi admin duyệt.");
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return; // lỗi validate form
      console.error("Lỗi khi chốt kết luận:", error);
      message.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Chốt kết luận báo cáo"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="Xác nhận kết luận"
      cancelText="Hủy"
      width={560}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Kết luận">
          <Radio.Group value={conclusion} onChange={handleChangeConclusion}>
            <Space direction="vertical">
              <Radio value="dat">
                <Tag color="green">Đạt</Tag> Báo cáo hợp lệ, đúng tiến độ
              </Radio>
              <Radio value="yeu_cau_bo_sung">
                <Tag color="orange">Yêu cầu bổ sung</Tag> Mở lại báo cáo này để nộp lại
              </Radio>
              <Radio value="yeu_cau_dieu_chinh">
                <Tag color="red">Yêu cầu điều chỉnh</Tag> Cần thay đổi nội dung/tiến độ/kinh phí đề tài
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {conclusion === "dat" && (
          <Form.Item name="content" label="Ghi chú (không bắt buộc)">
            <TextArea rows={3} placeholder="Nhận xét thêm nếu có..." />
          </Form.Item>
        )}

        {conclusion === "yeu_cau_bo_sung" && (
          <>
            <Form.Item
              name="content"
              label="Nội dung cần bổ sung"
              rules={[{ required: true, message: "Vui lòng nêu rõ nội dung cần bổ sung" }]}
            >
              <TextArea rows={4} placeholder="VD: Bổ sung minh chứng kết quả thí nghiệm..." />
            </Form.Item>
            <Form.Item name="dueDate" label="Hạn nộp lại (không bắt buộc)">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </>
        )}

        {conclusion === "yeu_cau_dieu_chinh" && (
          <>
            <Form.Item
              name="adjustmentTypes"
              label="Nội dung cần điều chỉnh"
              rules={[{ required: true, message: "Chọn ít nhất một mục cần điều chỉnh" }]}
            >
              <Checkbox.Group options={ADJUSTMENT_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="adjustmentReason"
              label="Lý do yêu cầu điều chỉnh"
              rules={[{ required: true, message: "Vui lòng nêu lý do" }]}
            >
              <TextArea rows={4} placeholder="VD: Tiến độ chậm so với thuyết minh, cần điều chỉnh mốc..." />
            </Form.Item>
            <Form.Item name="dueDate" label="Hạn nộp phiếu điều chỉnh (không bắt buộc)">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ReportConclusionModal;
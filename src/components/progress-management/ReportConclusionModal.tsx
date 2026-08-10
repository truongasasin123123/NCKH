import { useState } from 'react';
import { Form, Input, Modal, Radio, Space, Tag, message } from 'antd';
import {
  chotKetLuanBaoCao,
  type KetLuanBaoCao,
} from '../../services/progress/ProgressService';

const { TextArea } = Input;

const CONCLUSION_OPTIONS: Array<{
  value: KetLuanBaoCao;
  label: string;
  color: string;
  description: string;
}> = [
  { value: 'accepted', label: 'Đạt', color: 'green', description: 'Báo cáo đáp ứng yêu cầu theo dõi.' },
  { value: 'supplement', label: 'Yêu cầu bổ sung', color: 'orange', description: 'Nhóm trưởng được mở lại hồ sơ để bổ sung và gửi lại.' },
  { value: 'adjustment', label: 'Yêu cầu điều chỉnh', color: 'red', description: 'Ghi nhận kiến nghị điều chỉnh đề tài để thực hiện luồng xử lý tiếp theo.' },
  { value: 'liquidation', label: 'Đề xuất thanh lý', color: 'volcano', description: 'Chỉ là đề xuất; không tự động chuyển trạng thái đề tài.' },
];

interface ReportConclusionModalProps {
  open: boolean;
  reportId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ReportConclusionModal: React.FC<ReportConclusionModalProps> = ({
  open,
  reportId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<{ decision: KetLuanBaoCao; note: string }>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await chotKetLuanBaoCao(reportId, values.decision, values.note);
      message.success('Đã chốt kết luận báo cáo');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      console.error('Lỗi khi chốt kết luận báo cáo:', error);
      message.error('Không thể chốt kết luận báo cáo');
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
      okText="Xác nhận"
      cancelText="Hủy"
      width={580}
      afterOpenChange={(visible) => {
        if (visible) form.setFieldsValue({ decision: 'accepted', note: '' });
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ decision: 'accepted' }}>
        <Form.Item name="decision" label="Kết luận" rules={[{ required: true }]}>
          <Radio.Group>
            <Space direction="vertical" size="middle">
              {CONCLUSION_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.label}</Tag>
                  <span>{option.description}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="note"
          label="Nội dung kết luận"
          rules={[{ required: true, whitespace: true, message: 'Nhập nội dung kết luận' }]}
        >
          <TextArea rows={4} placeholder="Nêu rõ đánh giá, yêu cầu hoặc lý do đề xuất..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportConclusionModal;

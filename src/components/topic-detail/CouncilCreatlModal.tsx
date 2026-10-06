import { useEffect } from 'react';
import { Button, Form, Input, Modal, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TopicLoad } from '../../services/topic/TopicService';
import type { CouncilBusiness, CouncilType } from '../../services/council/CouncilService';

const { TextArea } = Input;

const businessHints: Partial<Record<CouncilBusiness, string>> = {
  approval: 'Đề tài ở trạng thái Nháp chỉ được yêu cầu hội đồng xét duyệt.',
  monitoring: 'Đề tài đã Bắt đầu chỉ được yêu cầu đội ngũ theo dõi.',
  scoring: 'Đề tài ở trạng thái Chờ nghiệm thu chỉ được yêu cầu hội đồng nghiệm thu.',
  liquidation: 'Đề nghị thành lập Hội đồng thanh lý để xem xét dừng đề tài trước hạn. Vui lòng ghi rõ lý do và đính kèm đơn/minh chứng (nếu có).',
};

interface Props {
  topic: TopicLoad | null;
  open: boolean;
  isResubmission: boolean;
  councilTypes: CouncilType[];
  allowedBusiness?: CouncilBusiness;
  allowedBusinesses?: CouncilBusiness[];
  disabledCouncilTypeIds?: number[];
  councilTypeId?: number;
  note: string;
  files: UploadFile[];
  onCouncilTypeChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onFilesChange: (files: UploadFile[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CouncilCreateModal({
  topic,
  open,
  isResubmission,
  councilTypes,
  allowedBusiness,
  allowedBusinesses,
  disabledCouncilTypeIds = [],
  councilTypeId,
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
      form.setFieldsValue({ MaLoaiHoiDong: councilTypeId, LyDoYeuCau: note });
    }
  }, [open, councilTypeId, note, form]);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      onSubmit();
    } catch {
      // Form tự hiển thị lỗi validate.
    }
  };

  const selectedType = councilTypes.find((item) => item.MaLoaiHoiDong === councilTypeId);
  const currentBusiness = selectedType?.NghiepVu || allowedBusiness;
  const activeHint = currentBusiness ? businessHints[currentBusiness] : undefined;

  const isOptionDisabled = (item: CouncilType) => {
    if (disabledCouncilTypeIds.includes(item.MaLoaiHoiDong)) return true;
    if (allowedBusinesses && allowedBusinesses.length > 0) {
      return !allowedBusinesses.includes(item.NghiepVu);
    }
    if (allowedBusiness) {
      return item.NghiepVu !== allowedBusiness;
    }
    return false;
  };

  return (
    <Modal
      title={isResubmission ? 'GỬI LẠI YÊU CẦU PHÂN CÔNG HỘI ĐỒNG' : 'YÊU CẦU PHÂN CÔNG HỘI ĐỒNG'}
      open={open}
      onCancel={onClose}
      width={760}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy</Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>Gửi yêu cầu</Button>,
      ]}
      destroyOnClose
    >
      {topic && (
        <>
          <p>
            <strong>Tên đề tài:</strong> {topic.TenDT}
          </p>
          <p>
            <strong>Trạng thái hiện tại:</strong> {topic.TrangThai}
          </p>
          <Form form={form} layout="vertical">
            <Form.Item
              name="MaLoaiHoiDong"
              label="Loại hội đồng cần phân công"
              rules={[{ required: true, message: 'Vui lòng chọn loại hội đồng' }]}
            >
              <Select
                placeholder="Chọn loại hội đồng"
                options={councilTypes.map((item) => ({
                  value: item.MaLoaiHoiDong,
                  label: item.TenLoaiHoiDong,
                  disabled: isOptionDisabled(item),
                }))}
                onChange={(val) => {
                  form.setFieldsValue({ MaLoaiHoiDong: val });
                  onCouncilTypeChange(val);
                }}
              />
            </Form.Item>
            {activeHint && (
              <p style={{ marginTop: -12, color: '#8c8c8c' }}>
                {activeHint}
              </p>
            )}
            <Form.Item
              name="LyDoYeuCau"
              label="Nội dung yêu cầu"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung yêu cầu' }]}
            >
              <TextArea
                rows={4}
                value={note}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder={
                  currentBusiness === 'liquidation'
                    ? 'Ví dụ: Đề nghị phân công Hội đồng thanh lý đề tài do thành viên bận việc đột xuất / không thể tiếp tục nghiên cứu...'
                    : 'Ví dụ: Đề nghị phân công hội đồng để xét duyệt hồ sơ đề tài.'
                }
              />
            </Form.Item>
            <Form.Item label="Tài liệu kèm theo (nếu có)">
              <Upload
                listType="text"
                multiple
                fileList={files}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.pptx"
                onChange={(info) => onFilesChange(info.fileList)}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Chọn tệp</Button>
              </Upload>
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

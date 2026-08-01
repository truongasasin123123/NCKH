import React from 'react';
import { Modal, Form, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { MocTienDo } from '../../services/progress/ProgressService';

interface UploadMocModalProps {
  open: boolean;
  onCancel: () => void;
  selectedMoc: MocTienDo | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onSubmit: () => void;
}

/**
 * Modal nộp file minh chứng cho một mốc tiến độ.
 */
const UploadMocModal: React.FC<UploadMocModalProps> = ({
  open, onCancel, selectedMoc, selectedFile, setSelectedFile, onSubmit,
}) => {
  return (
    <Modal
      title="Nộp file minh chứng"
      open={open}
      centered
      onCancel={onCancel}
      footer={null}
    >
      <Form layout="vertical" onFinish={onSubmit}>
        <Form.Item name="TepDinhKem" label="File minh chứng">
          <Upload
            beforeUpload={(file) => {
              setSelectedFile(file);
              return false;
            }}
            maxCount={1}
            disabled={selectedMoc ? selectedMoc.TrangThai === 'Trễ hạn' : false}
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>

          {selectedFile && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <strong>Đã chọn:</strong> {selectedFile.name}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
            Nếu có nhiều file gộp thành 1 file zip và gửi.
          </div>
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" disabled={!selectedFile}>
            Nộp
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UploadMocModal;

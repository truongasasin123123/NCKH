import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Row, Col, Button, Divider, Space, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { MocTienDo, ThanhVienMocDT } from '../../services/progress/ProgressService';
import type { TaiLieu } from '../../services/topic/DocumentsService';

const { TextArea } = Input;

interface ViewMocModalProps {
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  selectedMoc: MocTienDo | null;
  loadingMembers: boolean;
  thanhViens: ThanhVienMocDT[];
  mocDocuments: TaiLieu[];
  documentsLoading: boolean;
  downloadDocument: (maTL: number, tenFile: string) => void;
}

/**
 * Modal xem chi tiết mốc tiến độ (chỉ đọc), gồm thành viên và tài liệu minh chứng.
 */
const ViewMocModal: React.FC<ViewMocModalProps> = ({
  open, onCancel, form, selectedMoc, loadingMembers, thanhViens,
  mocDocuments, documentsLoading, downloadDocument,
}) => {
  return (
    <Modal
      title={`Thông tin mốc: ${selectedMoc?.TenMoc}`}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="TenMoc" label="Tên mốc">
          <Input disabled />
        </Form.Item>
        <Form.Item name="MoTa" label="Mô tả">
          <TextArea disabled rows={2} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="NgayBatDau" label="Ngày bắt đầu">
              <DatePicker disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="NgayKetThuc" label="Ngày kết thúc">
              <DatePicker disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="ThuTu" label="Thứ tự">
              <InputNumber min={1} disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="TrongSo" label="Trọng số (%)">
              <InputNumber min={0} max={100} disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="GhiChu" label="Ghi chú">
          <TextArea disabled rows={2} />
        </Form.Item>

        <Form.Item label="Thành viên thực hiện">
          <div
            style={{
              padding: '8px 12px',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              minHeight: '40px',
            }}
          >
            {loadingMembers ? (
              <span style={{ color: '#999' }}>
                Đang tải danh sách thành viên...
              </span>
            ) : thanhViens.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {thanhViens.map((item, index) => {
                  const ten = item.thanhVien?.NguoiDung?.TenDayDu;
                  const vaitro = item.thanhVien?.VaiTroDT;
                  const hienthi = `${ten} - ${vaitro}`;
                  return (
                    <Tag
                      key={index}
                      color="default"
                      style={{
                        width: 'fit-content',
                        padding: '4px 10px',
                        fontSize: '13px',
                      }}
                    >
                      {hienthi}
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <span style={{ color: '#999' }}>
                Mốc này chưa được phân công thành viên
              </span>
            )}
          </div>
        </Form.Item>
        <Divider />
        <Form.Item label="File minh chứng">
          {documentsLoading ? (
            <span>Đang tải tài liệu...</span>
          ) : mocDocuments.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {mocDocuments.map((document) => (
                <Space key={document.MaTL} wrap>
                  <span>{document.TenFile}</span>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadDocument(document.MaTL, document.TenFile)}
                  >
                    Tải xuống
                  </Button>
                </Space>
              ))}
            </Space>
          ) : (
            <Input disabled placeholder="Chưa có file đính kèm" />
          )}
        </Form.Item>
        <Form.Item>
          <Button type="default" onClick={onCancel}>Đóng</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ViewMocModal;

import React from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { MocTienDo, BaoCaoTienDo, LoaiBaoCao } from '../../services/progress/ProgressService';

const { TextArea } = Input;

interface BaoCaoModalProps {
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  editingBaoCao: BaoCaoTienDo | null;
  loaiBaoCao: LoaiBaoCao;
  setLoaiBaoCao: (value: LoaiBaoCao) => void;
  mocOptions: MocTienDo[] | undefined;
  baoCaoList: BaoCaoTienDo[];
  baoCaoFiles: File[];
  setBaoCaoFiles: (updater: (files: File[]) => File[]) => void;
  submittingBaoCao: boolean;
  partialAcceptance?: boolean;
  onFinish: (values: any) => void;
}

/**
 * Modal tạo mới hoặc cập nhật báo cáo tiến độ (ở trạng thái nháp).
 */
const BaoCaoModal: React.FC<BaoCaoModalProps> = ({
  open, onCancel, form, editingBaoCao, loaiBaoCao, setLoaiBaoCao,
  mocOptions, baoCaoList, baoCaoFiles, setBaoCaoFiles, submittingBaoCao, partialAcceptance = false, onFinish,
}) => {
  const isMilestoneBased = loaiBaoCao === 'Theo mốc' || partialAcceptance;
  return (
    <Modal
      title={editingBaoCao ? (partialAcceptance ? 'Cập nhật hồ sơ nghiệm thu mốc' : 'Cập nhật báo cáo tiến độ') : (partialAcceptance ? 'Tạo hồ sơ nghiệm thu mốc' : 'Tạo báo cáo tiến độ')}
      open={open}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onFinish({
          ...values,
          LoaiBaoCao: partialAcceptance ? 'Nghiệm thu từng phần' : values.LoaiBaoCao,
        })}
        initialValues={{ LoaiBaoCao: partialAcceptance ? 'Nghiệm thu từng phần' : 'Theo mốc' }}
      >
        {partialAcceptance && <Form.Item name="LoaiBaoCao" hidden rules={[{ required: true }]}><Input /></Form.Item>}
        {!partialAcceptance && <Form.Item name="LoaiBaoCao" label="Loại báo cáo" rules={[{ required: true }]}>
          <Select disabled={!!editingBaoCao} options={['Theo mốc', 'Định kỳ', 'Đột xuất'].map((value) => ({ value, label: value }))} onChange={(value: LoaiBaoCao) => { setLoaiBaoCao(value); form.setFieldsValue({ MaMoc: undefined, KyBaoCao: undefined }); }} />
        </Form.Item>}
        {isMilestoneBased ? (
          <Form.Item name="MaMoc" label="Mốc tiến độ" rules={[{ required: true, message: 'Chọn mốc tiến độ' }]}>
            <Select
              placeholder="Chọn mốc tiến độ..."
              disabled={!!editingBaoCao}
              options={(mocOptions || []).filter((moc) => editingBaoCao?.MaMoc === moc.MaMoc || (partialAcceptance
                ? moc.TrangThai === 'Hoàn thành' && !baoCaoList.some((report) => report.MaMoc === moc.MaMoc && report.LoaiBaoCao === loaiBaoCao)
                : moc.TrangThai !== 'Đã nghiệm thu' && !baoCaoList.some((report) => report.MaMoc === moc.MaMoc && report.LoaiBaoCao === loaiBaoCao)
              )).map((moc) => ({ value: moc.MaMoc, label: `${moc.ThuTu}. ${moc.TenMoc} (${moc.TrangThai})` }))}
            />
          </Form.Item>
        ) : (
          <Form.Item name="KyBaoCao" label="Kỳ / tiêu đề báo cáo" rules={[{ required: true, whitespace: true, message: 'Nhập kỳ hoặc tiêu đề báo cáo' }]}>
            <Input placeholder={loaiBaoCao === 'Định kỳ' ? 'Ví dụ: Báo cáo tháng 08/2026' : 'Ví dụ: Báo cáo sự cố thiết bị'} />
          </Form.Item>
        )}
        {!partialAcceptance && <Form.Item name="TienDoBaoCao" label="Tiến độ hiện tại (%)" rules={[{ required: true, message: 'Nhập tiến độ' }]}>
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>}
        <Form.Item name="NoiDungBaoCao" label={partialAcceptance ? 'Kết quả thực hiện mốc' : 'Nội dung báo cáo'} rules={[{ required: true, message: 'Nhập nội dung' }]}>
          <TextArea rows={4} placeholder={partialAcceptance ? 'Mô tả kết quả và sản phẩm đã hoàn thành của mốc' : 'Mô tả công việc đã thực hiện trong kỳ'} />
        </Form.Item>
        {!partialAcceptance && <Form.Item name="KhoKhan" label="Khó khăn">
          <TextArea rows={2} />
        </Form.Item>}
        <Form.Item name="DeXuat" label={partialAcceptance ? 'Kiến nghị với hội đồng' : 'Đề xuất'}>
          <TextArea rows={2} />
        </Form.Item>

        <Form.Item label="Tài liệu minh chứng">
          <Upload
            beforeUpload={(file) => {
              setBaoCaoFiles((files) => files.some((item) => item.name === file.name && item.size === file.size) ? files : [...files, file]);
              return false;
            }}
            multiple
            onRemove={(file) => setBaoCaoFiles((files) => files.filter((item) => item.name !== file.name || item.size !== file.size))}
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
          {baoCaoFiles.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <strong>Đã chọn:</strong> {baoCaoFiles.map((file) => file.name).join(', ')}
            </div>
          )}
        </Form.Item>

        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submittingBaoCao}>Lưu nháp</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BaoCaoModal;

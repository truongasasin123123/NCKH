import React, { useState, useEffect } from 'react';
import { Layout, Card, Timeline, Table, Progress, Button, Modal, Form, Input, DatePicker, InputNumber, Upload, message, Badge, Space, Tabs, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { getTopicProgress, createMocTienDo, updateMocTienDo, deleteMocTienDo, updateProgress } from './Quản lý thông tin đề án/ProgressService';
import type { MocTienDo, CapNhatTienDo } from './Quản lý thông tin đề án/ProgressService';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const { Content } = Layout;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface JwtPayload {
  VaiTro?: string;
  TaiKhoan?: string;
}

const ProgressManagement: React.FC = () => {
  const { maDT } = useParams<{ maDT: string }>();
  const maDTToUse = maDT || 'DT001'; // Sử dụng mock ID nếu không có params
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedMoc, setSelectedMoc] = useState<MocTienDo | null>(null);

  const [form] = Form.useForm();

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const userRole = user?.VaiTro || '';
  const userAccount = user?.TaiKhoan || '';

  // Kiểm tra quyền
  const isChuNhiem = userRole.toLowerCase().includes('chủ nhiệm') || userRole.toLowerCase().includes('chunhiem');
  const isThanhVien = userRole.toLowerCase().includes('thành viên') || userRole.toLowerCase().includes('thanhvien');
  const canEditMoc = isChuNhiem;
  const canUpdateProgress = isChuNhiem || isThanhVien;

  useEffect(() => {
    if (maDTToUse) {
      fetchProgressData();
    }
  }, [maDTToUse]);

  const fetchProgressData = async () => {
    if (!maDTToUse) return;
    setLoading(true);
    try {
      const data = await getTopicProgress(maDTToUse);
      setProgressData(data);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu tiến độ');
    } finally {
      setLoading(false);
    }
  };

  // Tính trạng thái tự động cho mốc
  const calculateStatus = (moc: MocTienDo): string => {
    // Với mock data, sử dụng trạng thái từ DB
    // Trong thực tế sẽ tính tự động như logic gốc
    return moc.TrangThai;
  };

  // Render timeline view
  const renderTimeline = () => {
    if (!progressData?.MocTienDo) return <div>Không có dữ liệu</div>;

    const sortedMocs = [...progressData.MocTienDo].sort((a, b) => a.ThuTu - b.ThuTu);

    return (
      <Timeline mode="left">
        {sortedMocs.map((moc: MocTienDo) => {
          const latestUpdate = progressData.CapNhatTienDo
            .filter((c: CapNhatTienDo) => c.MaMoc === moc.MaMoc)
            .sort((a: CapNhatTienDo, b: CapNhatTienDo) => dayjs(b.NgayCapNhat).valueOf() - dayjs(a.NgayCapNhat).valueOf())[0];

          const status = calculateStatus(moc);
          const percent = latestUpdate?.PhanTramHT || 0;

          let color = 'gray';
          let icon = <ClockCircleOutlined />;

          switch (status) {
            case 'Hoàn thành': color = 'green'; icon = <CheckCircleOutlined />; break;
            case 'Trễ hạn': color = 'red'; icon = <CloseCircleOutlined />; break;
            case 'Sắp hạn': color = 'orange'; icon = <ExclamationCircleOutlined />; break;
            case 'Đang thực hiện': color = 'blue'; break;
          }

          return (
            <Timeline.Item
              key={moc.MaMoc}
              color={color}
              dot={icon}
              label={`${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}`}
            >
              <Card
                title={moc.TenMoc}
                extra={
                  <Space>
                    <Badge status={status === 'Hoàn thành' ? 'success' : status === 'Trễ hạn' ? 'error' : status === 'Sắp hạn' ? 'warning' : 'processing'} text={status} />
                    {(canEditMoc || canUpdateProgress) && (
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditMoc(moc)}
                      >
                        Sửa 
                      </Button>
                    )}
                  </Space>
                }
              >
                <p>{moc.MoTa}</p>
                <p><strong>Trọng số:</strong> {moc.TrongSo}%</p>
                <Progress percent={percent} status={status === 'Trễ hạn' ? 'exception' : status === 'Hoàn thành' ? 'success' : 'active'} />
                {latestUpdate && (
                  <p><small>Cập nhật cuối: {dayjs(latestUpdate.NgayCapNhat).format('DD/MM/YYYY HH:mm')} - {latestUpdate.GhiChu}</small></p>
                )}
              </Card>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  // Render table view
  const renderTable = () => {
    if (!progressData?.MocTienDo) return <div>Không có dữ liệu</div>;

    const columns = [
      {
        title: 'Thứ tự',
        dataIndex: 'ThuTu',
        key: 'ThuTu',
        sorter: (a: MocTienDo, b: MocTienDo) => a.ThuTu - b.ThuTu,
      },
      {
        title: 'Tên mốc',
        dataIndex: 'TenMoc',
        key: 'TenMoc',
      },
      {
        title: 'Mô tả',
        dataIndex: 'MoTa',
        key: 'MoTa',
      },
      {
        title: 'Thời gian',
        key: 'ThoiGian',
        render: (moc: MocTienDo) => `${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}`,
      },
      {
        title: 'Trọng số',
        dataIndex: 'TrongSo',
        key: 'TrongSo',
        render: (value: number) => `${value}%`,
      },
      {
        title: 'Trạng thái',
        key: 'TrangThai',
        render: (moc: MocTienDo) => {
          const status = calculateStatus(moc);
          return <Badge status={status === 'Hoàn thành' ? 'success' : status === 'Trễ hạn' ? 'error' : status === 'Sắp hạn' ? 'warning' : 'processing'} text={status} />;
        },
      },
      {
        title: '% Hoàn thành',
        key: 'PhanTram',
        render: (moc: MocTienDo) => {
          const latestUpdate = progressData.CapNhatTienDo
            .filter((c: CapNhatTienDo) => c.MaMoc === moc.MaMoc)
            .sort((a: CapNhatTienDo, b: CapNhatTienDo) => dayjs(b.NgayCapNhat).valueOf() - dayjs(a.NgayCapNhat).valueOf())[0];
          return <Progress percent={latestUpdate?.PhanTramHT || 0} size="small" />;
        },
      },
      {
        title: 'Thao tác',
        key: 'actions',
        render: (moc: MocTienDo) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewMoc(moc)}>
              Xem
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditMoc(moc)}>
              Sửa
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteMoc(moc)}>
              Xóa
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={progressData.MocTienDo}
        rowKey="MaMoc"
        loading={loading}
        pagination={false}
      />
    );
  };


  // Handlers
  const handleCreateMoc = () => {
    setIsCreateModalVisible(true);
  };

  const handleEditMoc = (moc: MocTienDo) => {
    setSelectedMoc(moc);
    const latestUpdate = progressData?.CapNhatTienDo
      .filter((c: CapNhatTienDo) => c.MaMoc === moc.MaMoc)
      .sort((a: CapNhatTienDo, b: CapNhatTienDo) => dayjs(b.NgayCapNhat).valueOf() - dayjs(a.NgayCapNhat).valueOf())[0];

    form.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      PhanTramHT: latestUpdate?.PhanTramHT,
      GhiChu: latestUpdate?.GhiChu,
      TepDinhKem: latestUpdate?.TepDinhKem,
    });
    setIsEditModalVisible(true);
  };

  const handleViewMoc = (moc: MocTienDo) => {
    setSelectedMoc(moc);
    const latestUpdate = progressData?.CapNhatTienDo
      .filter((c: CapNhatTienDo) => c.MaMoc === moc.MaMoc)
      .sort((a: CapNhatTienDo, b: CapNhatTienDo) => dayjs(b.NgayCapNhat).valueOf() - dayjs(a.NgayCapNhat).valueOf())[0];

    form.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      PhanTramHT: latestUpdate?.PhanTramHT,
      GhiChu: latestUpdate?.GhiChu,
      TepDinhKem: latestUpdate?.TepDinhKem,
    });
    setIsViewModalVisible(true);
  };

  const handleDeleteMoc = async (moc: MocTienDo) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc muốn xóa mốc "${moc.TenMoc}"?`,
      onOk: async () => {
        try {
          await deleteMocTienDo(moc.MaMoc);
          message.success('Xóa mốc thành công');
          fetchProgressData();
        } catch (error) {
          message.error('Lỗi khi xóa mốc');
        }
      },
    });
  };

  const handleCreateMocSubmit = async (values: any) => {
    try {
      const newMoc = {
        ...values,
        MaDT: maDTToUse,
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
      };
      await createMocTienDo(newMoc);
      message.success('Tạo mốc thành công');
      setIsCreateModalVisible(false);
      form.resetFields();
      fetchProgressData();
    } catch (error) {
      message.error('Lỗi khi tạo mốc');
    }
  };

  const handleSaveSubmit = async (values: any) => {
    if (!selectedMoc) return;
    try {
      const updatedMoc = {
        ...values,
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
      };
      await updateMocTienDo(selectedMoc.MaMoc, updatedMoc);

      if (values.PhanTramHT !== undefined || values.GhiChu || values.TepDinhKem) {
        const capNhat = {
          MaMoc: selectedMoc.MaMoc,
          TaiKhoan: userAccount,
          NgayCapNhat: new Date(),
          PhanTramHT: values.PhanTramHT ?? 0,
          GhiChu: values.GhiChu || '',
          TepDinhKem: values.TepDinhKem,
        };
        await updateProgress(capNhat);
      }

      message.success('Cập nhật mốc và tiến độ thành công');
      setIsEditModalVisible(false);
      form.resetFields();
      fetchProgressData();
    } catch (error) {
      message.error('Lỗi khi cập nhật mốc và tiến độ');
    }
  };

  return (
    <Content style={{ padding: 24 }}>
      <Card
        title={`Quản lý tiến độ đề tài: ${progressData?.TenDT || ''}`}
        extra={
          <Space>
            
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMoc}>
                Thêm mốc
              </Button>
            
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Timeline" key="timeline">
            {renderTimeline()}
          </TabPane>
          <TabPane tab="Bảng" key="table">
            {renderTable()}
          </TabPane>
          
        </Tabs>
      </Card>

      {/* Modal tạo mốc */}
      <Modal
        title="Tạo mốc tiến độ"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateMocSubmit}>
          <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea />
          </Form.Item>
          <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Tạo</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa mốc và cập nhật tiến độ */}
      <Modal
        title={`Sửa / Cập nhật mốc: ${selectedMoc?.TenMoc}`}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSubmit}>
          <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea />
          </Form.Item>
          <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} />
          </Form.Item>

          <Divider />

          <Form.Item name="PhanTramHT" label="% Hoàn thành">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
            <Form.Item name="GhiChu" label="Ghi chú">
              <TextArea />
            </Form.Item>
          <Form.Item name="TepDinhKem" label="File minh chứng">
            <Upload>
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xem mốc */}
      <Modal
        title={`Thông tin mốc: ${selectedMoc?.TenMoc}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="TenMoc" label="Tên mốc">
            <Input disabled />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea disabled rows={3} />
          </Form.Item>
          <Form.Item name="NgayBatDau" label="Ngày bắt đầu">
            <DatePicker disabled />
          </Form.Item>
          <Form.Item name="NgayKetThuc" label="Ngày kết thúc">
            <DatePicker disabled />
          </Form.Item>
          <Form.Item name="ThuTu" label="Thứ tự">
            <InputNumber min={1} disabled style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="TrongSo" label="Trọng số (%)">
            <InputNumber min={0} max={100} disabled style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Form.Item name="PhanTramHT" label="% Hoàn thành">
            <InputNumber min={0} max={100} disabled style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="GhiChu" label="Ghi chú">
            <TextArea disabled rows={3} />
          </Form.Item>
          <Form.Item name="TepDinhKem" label="File minh chứng">
            <Input disabled />
          </Form.Item>
          <Form.Item>
            <Button type="default" onClick={() => setIsViewModalVisible(false)}>Đóng</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default ProgressManagement;
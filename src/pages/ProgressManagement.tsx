import React, { useState, useEffect } from 'react';
import { Layout, Card, Timeline, Table, Button, Modal, Form, Input, DatePicker, InputNumber, Upload, message, Badge, Space, Tabs, Divider, Select } from 'antd';
import { CheckOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopicProgress, createMocTienDo, updateMocTienDo, deleteMocTienDo, updateProgress, uploadMinhChung } from './Quản lý thông tin đề án/ProgressService';
import type { MocTienDo, CapNhatTienDo } from './Quản lý thông tin đề án/ProgressService';
import { getMemberByid, getMyTopics } from './Quản lý thông tin đề án/TopicService';
import type { ThanhVienDT, TopicLoad } from './Quản lý thông tin đề án/TopicService';
import { createNofitfications } from './Quản lý thông tin đề án/NotificationService';
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
  const navigate = useNavigate();
  const [selectedTopicId, setSelectedTopicId] = useState<string>(maDT || '');
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const maDTToUse = selectedTopicId || maDT || 'DT001'; // Sử dụng mock ID nếu không có params
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [members, setMembers] = useState<ThanhVienDT[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedMoc, setSelectedMoc] = useState<MocTienDo | null>(null);
  const [form] = Form.useForm();
  const watchedTepDinhKem = Form.useWatch('TepDinhKem', form);
  const [showTopicSearch, setShowTopicSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const userRole = user?.VaiTro || '';
  const userAccount = user?.TaiKhoan || '';

  const handleTopicChange = (value: string) => {
    setSelectedTopicId(value);
  };

  const handleGoToTopic = () => {
    if (selectedTopicId) {
      navigate(`/mainhome/progress/${selectedTopicId}`);
    }
  };

  const handleViewFile = (fileUrl?: string) => {
    if (!fileUrl) {
      message.warning('Chưa có file đính kèm');
      return;
    }
    window.open(fileUrl, '_blank');
  };

  const handleDownloadFile = (fileUrl?: string) => {
    if (!fileUrl) {
      message.warning('Chưa có file đính kèm');
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop() || 'tep-dinh-kem';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kiểm tra quyền
  const isChuNhiem = userRole.toLowerCase().includes('chủ nhiệm') || userRole.toLowerCase().includes('chunhiem');
  const isNhomTruong = isChuNhiem || userRole.toLowerCase().includes('nhóm trưởng') || userRole.toLowerCase().includes('nhomtruong');
  const canManageMoc = isNhomTruong;

  useEffect(() => {
    if (maDTToUse) {
      fetchProgressData();
    }
  }, [maDTToUse]);

  useEffect(() => {
    if (maDT) {
      setSelectedTopicId(maDT);
    }
  }, [maDT]);

  useEffect(() => {
    fetchTopicList();
  }, []);

  const fetchTopicList = async () => {
    setTopicLoading(true);
    try {
      const data = await getMyTopics();
      setTopics(data || []);
    } catch (error) {
      message.error('Lỗi khi tải danh sách đề tài');
    } finally {
      setTopicLoading(false);
    }
  };

  const fetchProgressData = async () => {
    if (!maDTToUse) return;
    setLoading(true);
    try {
      const data = await getTopicProgress(maDTToUse);
      setProgressData(data);
      try {
        const mem = await getMemberByid(maDTToUse);
        setMembers(mem || []);
      } catch (e) {
        console.error('Không lấy được danh sách thành viên:', e);
      }
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
          // percent removed: milestones no longer track percentage in UI

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
                  </Space>
                }
              >
                <p>{moc.MoTa}</p>
                <p><strong>Trọng số:</strong> {moc.TrongSo}%</p>
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
    const dataSource =
      progressData?.MocTienDo.filter((moc: MocTienDo) =>
        moc.TenMoc.toLowerCase().includes(searchText.toLowerCase())
      ) ?? [];
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
      { title: 'Trạng thái', key: 'TrangThai', render: (moc: MocTienDo) => { const status = calculateStatus(moc); return <Badge status={status === 'Hoàn thành' ? 'success' : status === 'Trễ hạn' ? 'error' : status === 'Sắp hạn' ? 'warning' : 'processing'} text={status} />; }, },
      // Removed percent-complete column per new requirement
      {
        title: 'Thao tác',
        key: 'actions',
        render: (moc: MocTienDo) => (
          <Space>
            <Button size="small" type="primary" className="btn-see" icon={<EyeOutlined />} onClick={() => handleViewMoc(moc)}>
              Xem
            </Button>
            {canManageMoc ? (
              <>
                <Button size="small" type="primary" className="btn-edit" icon={<EditOutlined />} onClick={() => handleEditMoc(moc)}>
                  Sửa
                </Button>
                <Button size="small" type="primary" className="btn-delete" icon={<DeleteOutlined />} onClick={() => handleDeleteMoc(moc)}>
                  Xóa
                </Button>
              </>
            ) : (
              <Button size="small" type="primary" className="btn-upload" icon={<UploadOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} disabled={calculateStatus(moc) === 'Hoàn thành' || calculateStatus(moc) === 'Trễ hạn'} onClick={() => handleSubmitMoc(moc)}>Nộp</Button>
            )}
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
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
      GhiChu: latestUpdate?.GhiChu,
      TepDinhKem: latestUpdate?.TepDinhKem,
    });
    setIsEditModalVisible(true);
  };

  const handleSubmitMoc = (moc: MocTienDo) => {
    const status = calculateStatus(moc);
    if (status === 'Hoàn thành' || status === 'Trễ hạn') {
      message.warning('Mốc đã hoàn thành hoặc trễ hạn, không thể nộp minh chứng.');
      return;
    }
    setSelectedMoc(moc);
    const latestUpdate = progressData?.CapNhatTienDo
      .filter((c: CapNhatTienDo) => c.MaMoc === moc.MaMoc)
      .sort((a: CapNhatTienDo, b: CapNhatTienDo) => dayjs(b.NgayCapNhat).valueOf() - dayjs(a.NgayCapNhat).valueOf())[0];

    form.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
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
    const currentStatus = calculateStatus(selectedMoc);
    if (!canManageMoc && currentStatus === 'Trễ hạn') {
      message.warning('Mốc đã trễ hạn, không thể nộp minh chứng.');
      return;
    }
    try {
      // Manager (nhóm trưởng / chủ nhiệm): full edit
      if (canManageMoc) {
        const updatedMoc = {
          ...values,
          NgayBatDau: values.NgayBatDau.toDate(),
          NgayKetThuc: values.NgayKetThuc.toDate(),
        };
        await updateMocTienDo(selectedMoc.MaMoc, updatedMoc);

        if (values.GhiChu || selectedFile) {
          let fileUrl = values.TepDinhKem;
          if (selectedFile) fileUrl = await uploadMinhChung(selectedFile);
          const capNhat = {
            MaMoc: selectedMoc.MaMoc,
            TaiKhoan: userAccount,
            NgayCapNhat: new Date(),
            GhiChu: values.GhiChu || '',
            TepDinhKem: fileUrl,
          } as any;
          await updateProgress(capNhat);
        }
      } else {
        // Member: only submit product / update progress and optionally resubmit file
        let fileUrl: string | undefined = undefined;
        if (selectedFile) {
          fileUrl = await uploadMinhChung(selectedFile);
        }

        const capNhat = {
          MaMoc: selectedMoc.MaMoc,
          TaiKhoan: userAccount,
          NgayCapNhat: new Date(),
          GhiChu: values.GhiChu
            ? `${values.GhiChu}\nĐã sửa file: ${selectedFile?.name || ''} vào ${new Date().toLocaleString()}`
            : (selectedFile ? `Đã sửa file: ${selectedFile.name} vào ${new Date().toLocaleString()}` : ''),
          TepDinhKem: fileUrl,
        } as any;
        await updateProgress(capNhat);

        // On member submit, mark milestone as completed
        await updateMocTienDo(selectedMoc.MaMoc, { TrangThai: 'Hoàn thành' });

        // Notify members and advisors
        try {
          const recipients = members.map(m => m.TaiKhoan).filter(Boolean) as string[];
          for (const r of recipients) {
            await createNofitfications(r, 'Mốc tiến độ được cập nhật', `Mốc "${selectedMoc.TenMoc}" đã được cập nhật bởi ${userAccount || 'Một thành viên'}.`);
          }
          const advisors = members.filter(m => m.VaiTroDT && (m.VaiTroDT.toLowerCase().includes('hướng dẫn') || m.VaiTroDT.toLowerCase().includes('huong dan') || m.VaiTroDT.toLowerCase().includes('người hướng')));
          for (const a of advisors) {
            await createNofitfications(a.TaiKhoan, 'Mốc tiến độ có file mới', `Thành viên đã nộp/tải lại file cho mốc "${selectedMoc.TenMoc}".`);
          }
        } catch (e) {
          console.error('Không gửi được thông báo:', e);
        }
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
        title={
          <Space>
            <span>
              Quản lý tiến độ đề tài:
              {!showTopicSearch && (
                <>
                  {" "}
                  <strong>{progressData?.TenDT}</strong>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setShowTopicSearch(true)}
                  />
                </>
              )}
            </span>

            {showTopicSearch && (
              <>
                <Select
                  showSearch
                  loading={topicLoading}
                  placeholder="Chọn đề tài..."
                  style={{ width: 300 }}
                  optionFilterProp="children"
                  value={selectedTopicId || undefined}
                  onChange={handleTopicChange}
                  filterOption={(input, option) =>
                    String(option?.children)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {topics.map((topic) => (
                    <Select.Option key={topic.MaDT} value={topic.MaDT}>
                      {topic.TenDT}
                    </Select.Option>
                  ))}
                </Select>

                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleGoToTopic();
                    setShowTopicSearch(false);
                  }}
                >
                  Tìm
                </Button>

              </>
            )}

          </Space>
        }

      >

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === "table" && (
              <Space>
                <Input.Search
                  allowClear
                  placeholder="Tìm kiếm mốc..."
                  style={{ width: 250 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {canManageMoc && (<Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMoc}> Thêm mốc </Button>)}
              </Space>
            )

          }
        >

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
            <Input disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
            <DatePicker disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
            <InputNumber min={1} disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
            <InputNumber min={0} max={100} disabled={!canManageMoc} />
          </Form.Item>

          <Divider />

          {/* % Hoàn thành removed — milestones are completed when students submit */}
          <Form.Item name="GhiChu" label="Ghi chú">
            <TextArea />
          </Form.Item>
          <Form.Item name="TepDinhKem" label="File minh chứng">
            <Upload
              beforeUpload={(file) => { setSelectedFile(file); return false; }}
              disabled={selectedMoc ? (calculateStatus(selectedMoc) === 'Hoàn thành' || calculateStatus(selectedMoc) === 'Trễ hạn') : false}
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            {selectedFile && <div style={{ marginTop: 8, fontSize: 12 }}>Đã chọn: {selectedFile.name}</div>}
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

          {/* % Hoàn thành removed from view */}
          <Form.Item name="GhiChu" label="Ghi chú">
            <TextArea disabled rows={3} />
          </Form.Item>
          <Form.Item name="TepDinhKem" label="File minh chứng">
            <Input disabled style={{ display: 'none' }} />
          </Form.Item>
          {watchedTepDinhKem ? (
            <Form.Item label="File minh chứng">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input value={watchedTepDinhKem} disabled />
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => handleViewFile(watchedTepDinhKem)}>
                    Xem file
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadFile(watchedTepDinhKem)}
                  >
                    Tải xuống
                  </Button>
                </Space>
              </Space>
            </Form.Item>
          ) : (
            <Form.Item label="File minh chứng">
              <Input disabled placeholder="Chưa có file đính kèm" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="default" onClick={() => setIsViewModalVisible(false)}>Đóng</Button>
          </Form.Item>
        </Form>

      </Modal>
    </Content>
  );
};

export default ProgressManagement;
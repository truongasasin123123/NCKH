import React, { useState, useEffect } from 'react';
import { Layout, Card, Timeline, Table, Button, Modal, Form, Input, DatePicker, InputNumber, Upload, message, Badge, Space, Tabs, Divider, Select, Row, Col, Tag } from 'antd';
import { CheckOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getTopicProgress, createMocTienDo, updateMocTienDo, deleteMocTienDo, getMemberById } from './Quản lý thông tin đề án/ProgressService';
import type { MocTienDo, CapNhatTienDo, ThanhVienMocDT } from './Quản lý thông tin đề án/ProgressService';
import { getMemberByid, getMyTopics } from './Quản lý thông tin đề án/TopicService';
import type { ThanhVienDT, TopicLoad } from './Quản lý thông tin đề án/TopicService';
import { downloadDocument, getDocumentsByMilestone, previewDocument, uploadDocument } from './Quản lý thông tin đề án/DocumentsService';
import type { TaiLieu } from './Quản lý thông tin đề án/DocumentsService';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { debounce } from 'lodash';


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
  const maDTToUse = selectedTopicId || maDT || 'DT01'; // Sử dụng mock ID nếu không có params
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [createOptions, setCreateOptions] = useState<any[]>([]);
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [members, setMembers] = useState<ThanhVienDT[]>([]);
  const [fetching, setFetching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thanhViens, setThanhViens] = useState<ThanhVienMocDT[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedMoc, setSelectedMoc] = useState<MocTienDo | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [viewForm] = Form.useForm();
  const [mocDocuments, setMocDocuments] = useState<TaiLieu[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showTopicSearch, setShowTopicSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;

  const handleTopicChange = (value: string) => {
    setSelectedTopicId(value);
  };

  const handleGoToTopic = () => {
    if (selectedTopicId) {
      navigate(`/mainhome/progress/${selectedTopicId}`);
    }
  };

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

  useEffect(() => {
    if (selectedMoc?.MaMoc) {
      const fetchMembers = async () => {
        try {
          setLoadingMembers(true);
          // Gọi API bằng MaMoc lấy từ mốc đang được chọn
          const data = await getMemberById(selectedMoc.MaMoc);
          setThanhViens(data);

          const memberOptions = data.map((item: any) => ({
            value: item.thanhVien.idTV,
            label: item.thanhVien.NguoiDung.TenDayDu,
          }));

          setEditOptions((prev: any[]) => {
            const merged = [...prev];

            memberOptions.forEach((option) => {
              if (!merged.some((x) => x.value === option.value)) {
                merged.push(option);
              }
            });

            return merged;
          });

          // Hiển thị sẵn các thành viên đã được chọn
          editForm.setFieldsValue({
            ThanhVienIds: data.map((item: any) => item.thanhVien.idTV),
          });
        } catch (error) {
          console.error("Lỗi khi lấy danh sách thành viên:", error);
        } finally {
          setLoadingMembers(false);
        }
      };

      fetchMembers();
    } else {
      setThanhViens([]);
    }
  }, [isViewModalVisible, selectedMoc]);

  useEffect(() => {
    if (!isViewModalVisible || !selectedMoc) {
      setMocDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        setMocDocuments(await getDocumentsByMilestone(selectedMoc.MaMoc));
      } catch (error) {
        console.error('Lỗi khi tải tài liệu mốc:', error);
        message.error('Không thể tải tài liệu minh chứng');
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [isViewModalVisible, selectedMoc]);

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
        setMembers(mem);
      } catch (e) {
        console.error('Không lấy được danh sách thành viên:', e);
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu tiến độ');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra quyền
  // Chỉ nhóm trưởng của đề tài hiện tại được sửa/xóa mốc.
  // Vai trò tài khoản (sinh viên, người hướng dẫn, ...) không quyết định quyền này.
  const normalizeRole = (role?: string) =>
    (role || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const currentMember = members.find(
    (member) => member.TaiKhoan === user?.TaiKhoan,
  );
  const canManageMoc = normalizeRole(currentMember?.VaiTroDT).includes('nhom truong');


  // Render timeline view
  const renderTimeline = () => {
    if (!progressData?.MocTienDo) {
      return <div>Không có dữ liệu</div>;
    }

    const sortedMocs = [...progressData.MocTienDo].sort(
      (a, b) => a.ThuTu - b.ThuTu
    );

    return (
      <Timeline mode="left">
        {sortedMocs.map((moc: MocTienDo) => {
          const status = moc.TrangThai;

          let color = "gray";
          let icon = <ClockCircleOutlined />;

          switch (status) {
            case "Hoàn thành":
              color = "green";
              icon = <CheckCircleOutlined />;
              break;

            case "Trễ hạn":
              color = "red";
              icon = <CloseCircleOutlined />;
              break;

            case "Sắp hạn":
              color = "orange";
              icon = <ExclamationCircleOutlined />;
              break;

            case "Đang thực hiện":
              color = "blue";
              break;
          }

          return (
            <Timeline.Item
              key={moc.MaMoc}
              color={color}
              dot={icon}
              label={`${dayjs(moc.NgayBatDau).format("DD/MM/YYYY")} - ${dayjs(
                moc.NgayKetThuc
              ).format("DD/MM/YYYY")}`}
            >
              <Card
                title={moc.TenMoc}
                extra={
                  <Badge
                    status={
                      status === "Hoàn thành"
                        ? "success"
                        : status === "Trễ hạn"
                          ? "error"
                          : status === "Sắp hạn"
                            ? "warning"
                            : "processing"
                    }
                    text={status}
                  />
                }
              >
                <p>{moc.MoTa}</p>

                <p>
                  <strong>Trọng số:</strong> {moc.TrongSo}%
                </p>

                {moc.GhiChu && (
                  <p>
                    <strong>Ghi chú:</strong> {moc.GhiChu}
                  </p>
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
      {
        title: 'Trạng thái',
        key: 'TrangThai',
        render: (moc: MocTienDo) => (
          <Badge
            status={
              moc.TrangThai === 'Hoàn thành'
                ? 'success'
                : moc.TrangThai === 'Trễ hạn'
                  ? 'error'
                  : moc.TrangThai === 'Sắp hạn'
                    ? 'warning'
                    : 'processing'
            }
            text={moc.TrangThai}
          />
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        render: (moc: MocTienDo) => (
          <Space>
            <Button
              size="small"
              type="primary"
              className="btn-see"
              icon={<EyeOutlined />}
              onClick={() => handleViewMoc(moc)}
            >
              Xem
            </Button>

            {canManageMoc ? (
              <>
                <Button
                  size="small"
                  type="primary"
                  className="btn-edit"
                  icon={<EditOutlined />}
                  onClick={() => handleEditMoc(moc)}
                >
                  Sửa
                </Button>

                <Button
                  size="small"
                  type="primary"
                  className="btn-delete"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteMoc(moc)}
                >
                  Xóa
                </Button>
              </>
            ) : (
              <Button
                size="small"
                type="primary"
                className="btn-upload"
                icon={<UploadOutlined />}
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                }}
                disabled={
                  moc.TrangThai === 'Hoàn thành' ||
                  moc.TrangThai === 'Trễ hạn'
                }
                onClick={() => handleSubmitMoc(moc)}
              >
                Nộp
              </Button>
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

    editForm.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      GhiChu: moc.GhiChu,
    });

    setIsEditModalVisible(true);
  };

  const handleSubmitMoc = (moc: MocTienDo) => {
    if (
      moc.TrangThai === "Hoàn thành"
    ) {
      message.warning("Mốc đã hoàn thành hoặc trễ hạn, không thể nộp.");
      return;
    }

    setSelectedMoc(moc);

    editForm.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      GhiChu: moc.GhiChu,
    });

    setIsEditModalVisible(true);
  };

  const handleViewMoc = (moc: MocTienDo) => {
    setSelectedMoc(moc);

    viewForm.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      GhiChu: moc.GhiChu,
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
        TrangThai: "Đang thực hiện",
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
      };
      await createMocTienDo(newMoc);
      message.success('Tạo mốc thành công');
      setIsCreateModalVisible(false);
      await handleReset();
      fetchProgressData();
    } catch (error) {
      message.error('Lỗi khi tạo mốc');
    }
  };

  const handleSaveSubmit = async (values: any) => {
    if (!selectedMoc) return;

    try {
      const updatedMoc: CapNhatTienDo = {
        TenMoc: values.TenMoc,
        MoTa: values.MoTa,
        ThuTu: values.ThuTu,
        TrongSo: values.TrongSo,
        GhiChu: values.GhiChu,
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
        NgayCapNhat: values.NgayCapNhat.toDate(),
      };

      await updateMocTienDo(selectedMoc.MaMoc, updatedMoc);

      if (selectedFile) {
        await uploadDocument({
          file: selectedFile,
          maDT: selectedMoc.MaDT || maDTToUse,
          maMoc: selectedMoc.MaMoc,
          loaiTaiLieu: 'Minh chứng tiến độ',
        });
      }

      message.success("Cập nhật mốc tiến độ thành công");

      setIsEditModalVisible(false);
      createForm.resetFields();
      setSelectedFile(null);

      fetchProgressData();
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi cập nhật mốc tiến độ");
    }
  };

  //Ham tim thanh vien
  const searchMember = debounce((value: string) => {
    if (!value) {
      setCreateOptions([]);
      return;
    }
    setFetching(true);

    const filtered = members.filter((member) =>
      member.NguoiDung.TenDayDu
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setCreateOptions(
      filtered.map((member) => ({
        label: member.NguoiDung.TenDayDu,
        value: member.idTV,
      }))
    );
  }, 300);

  const handleSearch = (value: string) => {
    searchMember(value);
  };

  const handleReset = () => {
    createForm.resetFields();
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
        <Form form={createForm} layout="vertical" onFinish={handleCreateMocSubmit}>
          <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
            <Input allowClear placeholder="Nhập tên mốc" />
          </Form.Item>

          <Form.Item name="MoTa" label="Mô tả">
            <TextArea allowClear placeholder="Nhập mô tả" rows={3} />
          </Form.Item>

          <Form.Item
            label="Thành viên"
            name="ThanhVienIds"
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất 1 thành viên" }
            ]}
          >
            <Select
              mode="multiple"
              showSearch
              allowClear // Thêm nút xóa nhanh danh sách đã chọn
              placeholder="Nhập tên tài khoản để thêm thành viên"
              onSearch={handleSearch}
              filterOption={false}
              notFoundContent={fetching ? "Đang tìm..." : "Không có kết quả"}
              options={createOptions}
              optionFilterProp="label"
            />
          </Form.Item>

          {/* Hàng 1: Đưa Ngày bắt đầu và Ngày kết thúc lên cùng 1 dòng */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} allowClear />
              </Form.Item>
            </Col>
          </Row>

          {/* Hàng 2: Đưa Thứ tự và Trọng số lên cùng 1 dòng */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="GhiChu" label="Ghi chú">
            <TextArea allowClear placeholder="Nhập ghi chú" rows={3} />
          </Form.Item>

          {/* Khu vực nút bấm */}
          <Form.Item style={{ marginBottom: 0, textAlign: 'center', }}>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 20 }}>
              <Button type="primary" htmlType="submit">
                Tạo
              </Button>

              <Button style={{ color: "white" }} onClick={handleReset} className='btn-delete'>
                Xóa
              </Button>
            </div>
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
        <Form form={editForm} layout="vertical" onFinish={handleSaveSubmit}>
          <Form.Item name="TenMoc" label="Tên mốc" rules={[{ required: true }]}>
            <Input disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea disabled={!canManageMoc} />
          </Form.Item>
          <Form.Item
            label="Thành viên"
            name="ThanhVienIds"
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất 1 thành viên" }
            ]}
          >
            <Select
              mode="multiple"
              showSearch
              allowClear // Thêm nút xóa nhanh danh sách đã chọn
              placeholder="Nhập tên tài khoản để thêm thành viên"
              onSearch={handleSearch}
              filterOption={false}
              notFoundContent={fetching ? "Đang tìm..." : "Không có kết quả"}
              options={editOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="NgayBatDau" label="Ngày bắt đầu" rules={[{ required: true }]}>
                <DatePicker disabled={!canManageMoc} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="NgayKetThuc" label="Ngày kết thúc" rules={[{ required: true }]}>
                <DatePicker disabled={!canManageMoc} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ThuTu" label="Thứ tự" rules={[{ required: true }]}>
                <InputNumber min={1} disabled={!canManageMoc} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="TrongSo" label="Trọng số (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} disabled={!canManageMoc} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="GhiChu" label="Ghi chú">
            <TextArea />
          </Form.Item>
          <Divider />

          {/* % Hoàn thành removed — milestones are completed when students submit */}
          <Form.Item name="TepDinhKem" label="File minh chứng">
            <Upload
              beforeUpload={(file) => { setSelectedFile(file); return false; }}
              disabled={
                selectedMoc
                  ? selectedMoc.TrangThai === "Hoàn thành" ||
                  selectedMoc.TrangThai === "Trễ hạn"
                  : false
              }
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
        <Form form={viewForm} layout="vertical">
          <Form.Item name="TenMoc" label="Tên mốc">
            <Input disabled />
          </Form.Item>
          <Form.Item name="MoTa" label="Mô tả">
            <TextArea disabled rows={2} />
          </Form.Item>

          {/* Đã sửa chữ 'col' thành 'Col' và thêm width 100% cho DatePicker */}
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
                    const hienthi = `${ten} - ${vaitro}`
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
          {/* % Hoàn thành removed from view */}
          <Form.Item label="File minh chứng">
            {documentsLoading ? (
              <span>Đang tải tài liệu...</span>
            ) : mocDocuments.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {mocDocuments.map((document) => (
                  <Space key={document.MaTL} wrap>
                    <span>{document.TenFile}</span>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => previewDocument(document.MaTL)}
                    >
                      Xem file
                    </Button>
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
            <Button type="default" onClick={() => setIsViewModalVisible(false)}>Đóng</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content >
  );
};

export default ProgressManagement;

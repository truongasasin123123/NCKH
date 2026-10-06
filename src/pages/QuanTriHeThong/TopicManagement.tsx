import { useEffect, useMemo, useState } from "react";
import { Table, Input, Select, Space, Tag, Button, message, Popover, Tabs, Descriptions, Grid } from "antd";
import { ReloadOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { getAdminTopics } from "../../services/topic/TopicService";
import type { TopicLoad } from "../../services/topic/TopicService";
import AdjustmentRequestManagement from './AdjustmentRequestManagement';

const STATUS_COLOR_MAP: Record<string, string> = {
  "Nháp": "default",
  "Chờ phê duyệt": "gold",
  "Chờ xét duyệt": "gold",
  "Chờ duyệt": "orange",
  "Chờ phân công hội đồng xét duyệt": "gold",
  "Chờ phân công hội đồng theo dõi": "gold",
  "Chờ phân công hội đồng nghiệm thu": "gold",
  "Chờ phân công hội đồng thanh lý": "volcano",
  "Chờ thanh lý": "orange",
  "Đã thanh lý": "default",
  "Từ chối": "red",
  "Đã phê duyệt": "blue",
  "Bắt đầu": "cyan",
  "Đang thực hiện": "blue",
  "Chờ nghiệm thu": "purple",
  "Đang nghiệm thu": "purple",
  "Đã nghiệm thu": "green",
  "Hoàn thành": "green",
};

const TopicManagement = () => {
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const [search, setSearch] = useState("");
  const [phanLoai, setPhanLoai] = useState<string | undefined>();
  const [trangThai, setTrangThai] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAdminTopics({
        keyword: search.trim() || undefined,
        phanLoai,
        trangThai,
        page,
        limit: pageSize,
      });
      setTopics(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đề tài:", error);
      message.error("Không thể tải danh sách đề tài");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, phanLoai, trangThai]);

  // Build option lọc trực tiếp từ dữ liệu thật, tránh đoán sai giá trị enum
  const phanLoaiOptions = useMemo(() => {
    const set = new Set(topics.map((t) => t.PhanLoai).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [topics]);

  const trangThaiOptions = useMemo(() => {
    const set = new Set(topics.map((t) => t.TrangThai).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [topics]);

  const handleResetFilter = () => {
    setSearch("");
    setPhanLoai(undefined);
    setTrangThai(undefined);
    setPage(1);
  };

  const getLeaderName = (record: TopicLoad) => {
    if (record.NhomTruong) {
      return record.NhomTruong.TenDayDu || record.NhomTruong.TaiKhoan;
    }
    const leader = record.ThanhVienDT?.find((tv) => {
      const role = tv.VaiTroDT
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d");
      return role?.includes("truong nhom") || role?.includes("nhom truong");
    });
    return leader?.NguoiDung?.TenDayDu || leader?.TaiKhoan || "-";
  };

  const activeFilterCount = Number(Boolean(phanLoai)) + Number(Boolean(trangThai));
  const filterContent = (
    <Space direction="vertical" size="middle" style={{ width: 260 }}>
      <Select
        placeholder="Phân loại"
        allowClear
        value={phanLoai}
        onChange={(value) => {
          setPhanLoai(value);
          setPage(1);
        }}
        options={phanLoaiOptions}
        showSearch
      />
      <Select
        placeholder="Trạng thái"
        allowClear
        value={trangThai}
        onChange={(value) => {
          setTrangThai(value);
          setPage(1);
        }}
        options={trangThaiOptions}
      />
      <Button icon={<ReloadOutlined />} onClick={handleResetFilter} block>
        Đặt lại bộ lọc
      </Button>
    </Space>
  );

  const desktopColumns: ColumnsType<TopicLoad> = [
    { title: "Mã đề tài", dataIndex: "MaDT", key: "MaDT", width: 120 },
    { title: "Tên đề tài", dataIndex: "TenDT", key: "TenDT" },
    { title: "Phân loại", dataIndex: "PhanLoai", key: "PhanLoai", width: 160 },
    {
      title: "Trạng thái",
      dataIndex: "TrangThai",
      key: "TrangThai",
      width: 160,
      render: (value: string) => (
        <Tag color={STATUS_COLOR_MAP[value] ?? "default"}>{value}</Tag>
      ),
    },
    {
      title: "Nhóm trưởng",
      key: "leader",
      width: 160,
      render: (_, record) => getLeaderName(record),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/mainhome/admin/topics/${record.MaDT}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const mobileColumns: ColumnsType<TopicLoad> = [
    {
      title: "Đề tài",
      key: "topic",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1677ff', lineHeight: 1.4 }}>{record.TenDT}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>Mã: {record.MaDT}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "TrangThai",
      key: "TrangThai",
      width: 130,
      align: "right",
      render: (value: string) => (
        <Tag color={STATUS_COLOR_MAP[value] ?? "default"} style={{ margin: 0, whiteSpace: 'normal', textAlign: 'center' }}>
          {value}
        </Tag>
      ),
    },
  ];

  const renderExpandedContent = (record: TopicLoad) => (
    <div style={{ padding: '4px 0' }}>
      <Descriptions size="small" column={1} bordered={false}>
        <Descriptions.Item label="Phân loại">{record.PhanLoai || '—'}</Descriptions.Item>
        <Descriptions.Item label="Nhóm trưởng">{getLeaderName(record)}</Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/mainhome/admin/topics/${record.MaDT}`);
          }}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  );

  const topicsTab = (
    <>
      <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, width: '100%' }} wrap>
        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
          <Input.Search
            placeholder="Tìm theo mã hoặc tên đề tài"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => {
              setPage(1);
              fetchData();
            }}
            style={{ width: isMobile ? '100%' : 300 }}
          />

          <Popover content={filterContent} trigger="click" placement="bottomLeft">
            <Button icon={<FilterOutlined />}>
              Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </Popover>
        </Space>
      </Space>

      <Table
        rowKey="MaDT"
        columns={isMobile ? mobileColumns : desktopColumns}
        dataSource={topics}
        loading={loading}
        size={isMobile ? 'small' : 'middle'}
        scroll={isMobile ? undefined : { x: 800 }}
        expandable={
          isMobile
            ? {
                expandedRowRender: renderExpandedContent,
                expandRowByClick: true,
              }
            : undefined
        }
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          simple: isMobile,
          showTotal: isMobile ? undefined : (count) => `Tổng ${count} đề tài`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />
    </>
  );

  return (
    <div style={{ background: '#fff', padding: isMobile ? 12 : 20, borderRadius: 6 }}>
      <Tabs
        defaultActiveKey="topics"
        items={[
          { key: 'topics', label: 'Danh sách đề tài', children: topicsTab },
          { key: 'adjustments', label: 'Phiếu điều chỉnh', children: <AdjustmentRequestManagement embedded /> },
        ]}
      />
    </div>
  );
};

export default TopicManagement;

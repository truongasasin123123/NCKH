import { useEffect, useMemo, useState } from "react";
import { Table, Input, Select, Space, Tag, Card, Typography, Button, message, Popover } from "antd";
import { SearchOutlined, ReloadOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { getAdminTopics } from "../../services/topic/TopicService";
import type { TopicLoad } from "../../services/topic/TopicService";

const { Title } = Typography;

const STATUS_COLOR_MAP: Record<string, string> = {
  "Nháp": "default",
  "Chờ phê duyệt": "gold",
  "Chờ xét duyệt": "gold",
  "Chờ duyệt": "orange",
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
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const columns: ColumnsType<TopicLoad> = [
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
      render: (_, record) => {
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
      },
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

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>Quản lý đề tài toàn hệ thống</Title>
      <p style={{ color: "#667085", marginBottom: 20 }}>
        Tra cứu toàn bộ đề tài và xem chi tiết hồ sơ theo quyền quản trị.
      </p>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Tìm theo mã hoặc tên đề tài"
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              fetchData();
            }}
            style={{ width: 280 }}
          />

          <Popover content={filterContent} trigger="click" placement="bottomLeft">
            <Button icon={<FilterOutlined />}>
              Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
          </Popover>
        </Space>
      </Card>

      <Table
        rowKey="MaDT"
        columns={columns}
        dataSource={topics}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => `Tổng ${count} đề tài`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />
    </div>
  );
};

export default TopicManagement;

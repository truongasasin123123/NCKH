import { useEffect, useMemo, useState } from "react";
import { Table, Input, Select, Space, Tag, Card, Typography, Button } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getMyTopics } from "../../services/topic/TopicService";
import type { TopicLoad } from "../../services/topic/TopicService";

const { Title } = Typography;

// TODO: chỉnh lại màu theo đúng giá trị TrangThai thực tế trong DB
const STATUS_COLOR_MAP: Record<string, string> = {
  "Chờ duyệt": "orange",
  "Đang thực hiện": "blue",
  "Hoàn thành": "green",
  "Từ chối": "red",
};

const TopicManagement = () => {
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [phanLoai, setPhanLoai] = useState<string | undefined>();
  const [trangThai, setTrangThai] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getMyTopics(); // BE trả toàn bộ đề tài khi gọi với token admin
      setTopics(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đề tài:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build option lọc trực tiếp từ dữ liệu thật, tránh đoán sai giá trị enum
  const phanLoaiOptions = useMemo(() => {
    const set = new Set(topics.map((t) => t.PhanLoai).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [topics]);

  const trangThaiOptions = useMemo(() => {
    const set = new Set(topics.map((t) => t.TrangThai).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [topics]);

  const filteredData = useMemo(() => {
    return topics.filter((t) => {
      const matchSearch =
        !search ||
        t.MaDT?.toLowerCase().includes(search.toLowerCase()) ||
        t.TenDT?.toLowerCase().includes(search.toLowerCase());
      const matchPhanLoai = !phanLoai || t.PhanLoai === phanLoai;
      const matchTrangThai = !trangThai || t.TrangThai === trangThai;
      return matchSearch && matchPhanLoai && matchTrangThai;
    });
  }, [topics, search, phanLoai, trangThai]);

  const handleResetFilter = () => {
    setSearch("");
    setPhanLoai(undefined);
    setTrangThai(undefined);
  };

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
      title: "Trưởng nhóm",
      key: "leader",
      width: 160,
      render: (_, record) => {
        // TODO: đổi "Trưởng nhóm" theo đúng giá trị VaiTroDT trong DB
        const leader = record.ThanhVienDT?.find((tv) => tv.VaiTroDT === "Trưởng nhóm");
        return leader?.NguoiDung?.TenDayDu ?? "-";
      },
    },
    {
      title: "Kinh phí",
      dataIndex: "TongKinhPhi",
      key: "TongKinhPhi",
      width: 140,
      render: (value: number) => (value != null ? value.toLocaleString("vi-VN") + " đ" : "-"),
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "NgayBatDau",
      key: "NgayBatDau",
      width: 120,
      render: (value: Date) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "NgayKetThuc",
      key: "NgayKetThuc",
      width: 120,
      render: (value: Date) => (value ? new Date(value).toLocaleDateString("vi-VN") : "-"),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Quản lý đề tài</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Tìm theo mã hoặc tên đề tài"
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />

          <Select
            placeholder="Phân loại"
            allowClear
            style={{ width: 200 }}
            value={phanLoai}
            onChange={setPhanLoai}
            options={phanLoaiOptions}
            showSearch
          />

          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 180 }}
            value={trangThai}
            onChange={setTrangThai}
            options={trangThaiOptions}
          />

          <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
            Xóa bộ lọc
          </Button>
        </Space>
      </Card>

      <Table
        rowKey="MaDT"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} đề tài`,
        }}
      />
    </div>
  );
};

export default TopicManagement;
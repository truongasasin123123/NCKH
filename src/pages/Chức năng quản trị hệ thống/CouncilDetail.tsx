import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Descriptions, Table, Button, Select, message, Popconfirm, Tag, AutoComplete } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getCouncilDetail,
  getCouncilMembers,
  addCouncilMember,
  removeCouncilMember,
  searchAccounts,
  DEFAULT_COUNCILS,
} from "../Quản lý thông tin đề án/CouncilService";

import type { Council, CouncilMember } from "../Quản lý thông tin đề án/CouncilService";

const { Option } = Select;

const ROLE_LABEL: Record<string, string> = {
  ChuTich: "Chủ tịch",
  UyVien: "Ủy viên",
  ThuKy: "Thư ký",
};

const CouncilDetail: React.FC = () => {
  const { maHoiDong } = useParams<{ maHoiDong: string }>();
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("UyVien");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchAll = async () => {
    if (!maHoiDong) return;
    setPageLoading(true);
    try {
      const defaultCouncil = DEFAULT_COUNCILS.find((c) => c.MaHoiDong === maHoiDong);

      if (defaultCouncil) {
        setCouncil(defaultCouncil);
      } else {
        const detail = await getCouncilDetail(maHoiDong);
        setCouncil(detail);
      }

      const memberList = await getCouncilMembers(maHoiDong);
      setMembers(memberList);
    } catch (err) {
      message.error("Không tải được dữ liệu hội đồng");
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [maHoiDong]);

  const handleSearch = async (keyword: string) => {
    if (!keyword) {
      setOptions([]);
      return;
    }
    const results = await searchAccounts(keyword);
    setOptions(
      results.map((u: any) => ({
        value: u.TaiKhoan,
        label: `${u.TaiKhoan} - ${u.HoTen}`,
      }))
    );
  };

  const handleAddMember = async () => {
    if (!selectedAccount || !maHoiDong) {
      message.warning("Chọn tài khoản trước khi thêm");
      return;
    }
    setLoading(true);
    try {
      await addCouncilMember(maHoiDong, selectedAccount, selectedRole);
      message.success("Thêm thành viên thành công");
      setSelectedAccount("");
      fetchAll();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Thêm thành viên thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (maThanhVien: string) => {
    if (!maHoiDong) return;
    try {
      await removeCouncilMember(maHoiDong, maThanhVien);
      message.success("Đã xóa thành viên");
      fetchAll();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  const columns = [
    { title: "Tài khoản", dataIndex: "TaiKhoan" },
    { title: "Họ tên", dataIndex: "HoTen" },
    {
      title: "Vai trò",
      dataIndex: "VaiTroHoiDong",
      render: (role: string) => (
        <Tag color={role === "ChuTich" ? "gold" : role === "ThuKy" ? "blue" : "default"}>
          {ROLE_LABEL[role] || role}
        </Tag>
      ),
    },
    {
      title: "Chức năng",
      render: (_: any, record: CouncilMember) => (
        <Popconfirm
          title="Xóa thành viên này khỏi hội đồng?"
          onConfirm={() => handleRemove(record.MaThanhVien)}
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  if (pageLoading) return <div style={{ padding: 24 }}>Đang tải...</div>;

  if (!council) {
    return <div style={{ padding: 24 }}>Không tìm thấy hội đồng.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title="Thông tin hội đồng" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Mã hội đồng">{council.MaHoiDong}</Descriptions.Item>
          <Descriptions.Item label="Tên hội đồng">{council.TenHoiDong}</Descriptions.Item>
          <Descriptions.Item label="Loại hội đồng">{council.LoaiHoiDong}</Descriptions.Item>
          <Descriptions.Item label="Mô tả">{council.MoTa}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Thành viên hội đồng">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <AutoComplete
            style={{ flex: 1 }}
            options={options}
            onSearch={handleSearch}
            onSelect={(value) => setSelectedAccount(value)}
            placeholder="Tìm tài khoản (vd: gv001, tên...)"
          />
          <Select value={selectedRole} onChange={setSelectedRole} style={{ width: 140 }}>
            <Option value="ChuTich">Chủ tịch</Option>
            <Option value="UyVien">Ủy viên</Option>
            <Option value="ThuKy">Thư ký</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} loading={loading} onClick={handleAddMember}>
            Thêm
          </Button>
        </div>

        <Table rowKey="MaThanhVien" columns={columns} dataSource={members} pagination={false} />
      </Card>
    </div>
  );
};

export default CouncilDetail;
import { useEffect, useState } from "react";
import { Table, Typography, Button, Modal, Form, Input, Select, message, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getCouncils, createCouncil } from "../ThongTinDeTai/CouncilService";
import type { Council } from "../ThongTinDeTai/CouncilService";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Danh mục loại hội đồng đang có trong hệ thống
const LOAI_HOI_DONG = [
    { value: "KHDT_Khoa", label: "Hội đồng Khoa học - Đào tạo Khoa" },
    { value: "XetChonThamDinh", label: "Hội đồng xét chọn / tuyển chọn / thẩm định" },
    { value: "KiemTraGiamSat", label: "Hội đồng kiểm tra, giám sát" },
    { value: "NghiemThu", label: "Hội đồng nghiệm thu" },
    { value: "ThanhLy", label: "Hội đồng thanh lý" },
    { value: "SVNCKH", label: "Hội đồng xét chọn công trình SVNCKH" },
];

const CouncilList: React.FC = () => {
    const navigate = useNavigate();
    const [councils, setCouncils] = useState<Council[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form] = Form.useForm();

    const fetchCouncils = async () => {
        setLoading(true);
        try {
            const data = await getCouncils();
            setCouncils(data);
        } catch (err) {
            message.error("Không tải được danh sách hội đồng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouncils();
    }, []);

    // Chọn loại hội đồng thì tự điền mô tả gợi ý, người dùng vẫn sửa được
    const handleLoaiChange = (value: string) => {
        const loai = LOAI_HOI_DONG.find((l) => l.value === value);
        if (loai && !form.getFieldValue("MoTa")) {
            form.setFieldValue("MoTa", loai.label);
        }
        if (!form.getFieldValue("MaHoiDong")) {
            form.setFieldValue("MaHoiDong", value);
        }
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            setCreating(true);
            await createCouncil(values);
            message.success("Đã tạo hội đồng mới.");
            setOpenCreate(false);
            form.resetFields();
            fetchCouncils();
        } catch (err: any) {
            if (err?.errorFields) return; // lỗi validate, antd tự hiển thị dưới field
            message.error(err?.response?.data?.message || "Tạo hội đồng thất bại.");
        } finally {
            setCreating(false);
        }
    };

    const filtered = councils.filter(
        (c) =>
            c.TenHoiDong.toLowerCase().includes(search.toLowerCase()) ||c.MaHoiDong.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            title: "Tên hội đồng",
            dataIndex: "TenHoiDong",
            render: (text: string, record: Council) => (
                <a onClick={() => navigate(record.MaHoiDong)}>{text}</a>
            ),
        },
        {
            title: "Mô tả",
            dataIndex: "MoTa",
            render: (text: string) => <Text type="secondary">{text}</Text>,
        },
        {
            title: "Chức năng",
            render: (_: any, record: Council) => (
                <Button type="link" onClick={() => navigate(record.MaHoiDong)}>
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Title level={4} style={{ margin: 0 }}>
                    Danh sách hội đồng
                </Title>
                <Space>
                    <Input.Search
                        placeholder="Tìm theo tên hoặc mã hội đồng"
                        allowClear
                        style={{ width: 280 }}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
                        Tạo hội đồng
                    </Button>
                </Space>
            </div>

            <Table
                rowKey="MaHoiDong"
                columns={columns}
                dataSource={filtered}
                loading={loading}
                pagination={{ pageSize: 10, showTotal: (total) => `${total} hội đồng` }}
            />

            <Modal
                title="Tạo hội đồng mới"
                open={openCreate}
                onCancel={() => {
                    setOpenCreate(false);
                    form.resetFields();
                }}
                onOk={handleCreate}
                confirmLoading={creating}
                okText="Tạo hội đồng"
                cancelText="Huỷ"
                destroyOnClose
            >
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Form.Item
                        name="LoaiHoiDong"
                        label="Loại hội đồng"
                        rules={[{ required: true, message: "Vui lòng chọn loại hội đồng." }]}
                    >
                        <Select
                            placeholder="Chọn loại hội đồng"
                            options={LOAI_HOI_DONG}
                            onChange={handleLoaiChange}/>
                    </Form.Item>
                    <Form.Item
                        name="TenHoiDong"
                        label="Tên hội đồng"
                        rules={[{ required: true, message: "Vui lòng nhập tên hội đồng." }]}
                    >
                        <Input placeholder="VD: Hội đồng nghiệm thu đợt 1 - 2026" />
                    </Form.Item>
                    <Form.Item
                        name="MaHoiDong"
                        label="Mã hội đồng"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã hội đồng." },
                            { pattern: /^[A-Za-z0-9_]+$/, message: "Chỉ gồm chữ, số và dấu gạch dưới." },
                        ]}
                    >
                        <Input placeholder="VD: NghiemThu_2026" />
                    </Form.Item>
                    <Form.Item name="MoTa" label="Mô tả">
                        <TextArea rows={3} placeholder="Mô tả chức năng của hội đồng" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CouncilList;
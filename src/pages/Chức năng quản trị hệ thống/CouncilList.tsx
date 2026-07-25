import { Table, Typography, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { DEFAULT_COUNCILS } from "../Quản lý thông tin đề án/CouncilService";
import type { Council } from "../Quản lý thông tin đề án/CouncilService";

const { Title } = Typography;

const CouncilList: React.FC = () => {
    const navigate = useNavigate();

    const columns = [
        { title: "Tên hội đồng", dataIndex: "TenHoiDong" },
        { title: "Mô tả", dataIndex: "MoTa" },
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
            <Title level={4} style={{ marginBottom: 16 }}>Danh sách hội đồng</Title>
            <Table
                rowKey="MaHoiDong"
                columns={columns}
                dataSource={DEFAULT_COUNCILS}
                pagination={false}
            />
        </div>
    );
};

export default CouncilList;
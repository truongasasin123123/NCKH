import { Modal, Select, Button, message } from "antd";
import { useEffect, useState } from "react";
import { getCouncils, assignCouncilToTopic } from "../Quản lý thông tin đề án/CouncilService";
import type { Council } from "../Quản lý thông tin đề án/CouncilService";

interface Props {
    open: boolean;
    maDT: string;
    onClose: () => void;
    onSuccess: () => void;
}

const AssignCouncilModal: React.FC<Props> = ({ open, maDT, onClose, onSuccess }) => {
    const [councils, setCouncils] = useState<Council[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            getCouncils().then(setCouncils);
        }
    }, [open]);

    const handleAssign = async () => {
        if (!selected) {
            message.warning("Chọn hội đồng trước khi gán");
            return;
        }
        setLoading(true);
        try {
            await assignCouncilToTopic(maDT, selected);
            message.success("Gán hội đồng thành công");
            onSuccess();
            onClose();
        } catch (err: any) {
            message.error(err?.response?.data?.message || "Gán hội đồng thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Gán hội đồng cho đề tài" open={open} onCancel={onClose} footer={null} destroyOnClose>
            <Select
                style={{ width: "100%", marginBottom: 16 }}
                placeholder="Chọn hội đồng"
                onChange={setSelected}
                options={councils.map((c) => ({ value: c.MaHoiDong, label: c.TenHoiDong }))}
            />
            <div style={{ textAlign: "right" }}>
                <Button onClick={onClose} style={{ marginRight: 8 }}>
                    Hủy
                </Button>
                <Button type="primary" loading={loading} onClick={handleAssign}>
                    Gán hội đồng
                </Button>
            </div>
        </Modal>
    );
};

export default AssignCouncilModal;
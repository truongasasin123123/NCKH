import { Form, Input, Button, message } from "antd";
import "../style/auth.css";
import { useNavigate } from "react-router-dom";
import ApiAxios from "../axios.config";

interface FormType {
    TenDayDu: string;
    Gmail: string;
    SDT: string;
}

function CompleteProfile() {
    const navigate = useNavigate();

    const onFinish = async (values: FormType) => {
        const { TenDayDu, Gmail, SDT } = values;

        if (!TenDayDu || !Gmail || !SDT) {
            message.error("Không được để trống!");
            return;
        }

        try {
            await ApiAxios.put("/auth/profile", { TenDayDu, Gmail, SDT });
            message.success("Cập nhật thông tin thành công!");
            navigate("/home");
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại!");
            console.log(error);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box auth-box--register">
                <h2 className="auth-title">Hoàn thiện hồ sơ</h2>
                <p className="auth-sub">
                    Vui lòng bổ sung thông tin cá nhân trước khi tiếp tục
                </p>

                <Form
                    name="complete-profile"
                    className="auth-form"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Tên đầy đủ"
                        name="TenDayDu"
                        className="auth-input"
                        rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Gmail:"
                        name="Gmail"
                        className="auth-input"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            { type: "email", message: "Email không hợp lệ!" },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Số điện thoại:"
                        name="SDT"
                        className="auth-input"
                        rules={[
                            { required: true, message: "Vui lòng nhập số điện thoại!" },
                            { pattern: /^0\d{9}$/, message: "Số điện thoại không hợp lệ!" },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block className="custom-button">
                            Hoàn tất
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}

export default CompleteProfile;
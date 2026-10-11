import { Form, Input, Button, message } from "antd";
import "../style/auth.css";
import ApiAxios, { formatErrorMessage } from "../axios.config";

interface FormType {
    TenDayDu: string;
    Gmail: string;
    SDT: string;
}

function CompleteProfile() {
    const onFinish = async (values: FormType) => {
        const { TenDayDu, Gmail, SDT } = values;

        if (!TenDayDu || !Gmail || !SDT) {
            message.error("Không được để trống!");
            return;
        }

        try {
            const res = await ApiAxios.put("/auth/profile", { TenDayDu, Gmail, SDT });
            if (res.data?.access_token) {
                if (localStorage.getItem("access_token")) {
                    localStorage.setItem("access_token", res.data.access_token);
                } else {
                    sessionStorage.setItem("access_token", res.data.access_token);
                }
            }
            message.success("Cập nhật thông tin thành công!");
            window.location.href = "/home";
        } catch (error: any) {
            message.error(formatErrorMessage(error, "Cập nhật thông tin thất bại, vui lòng thử lại"));
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
                        normalize={(value) => (value ? value.replace(/\D/g, '').slice(0, 10) : value)}
                        rules={[
                            { required: true, message: "Vui lòng nhập số điện thoại!" },
                            { pattern: /^0\d{9}$/, message: "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0!" },
                        ]}
                    >
                        <Input inputMode="numeric" maxLength={10} placeholder="Ví dụ: 0912345678" />
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
import { Form, Input, Button, message } from "antd";
import "../style/auth.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import ApiAxios from "../axios.config";
import { useState } from "react";


interface FormType {
    MatKhau: string;
}

function ChangePass() {
    const [searchFarams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: FormType) => {
        try {
            setLoading(true);
            const token = searchFarams.get("token");

            if (!token) {
                message.error("Link đổi mật khẩu không hợp lệ hoặc đã hết hạn");
                return;
            }

            await ApiAxios.post("/auth/resetpassword", { token, newPassword: values.MatKhau });
            message.success(`Đổi mật khẩu thành công!`);
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error: any) {
            message.error(error?.response?.data?.message);
        } finally{
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-page">



                <div className="auth-box auth-box--register">
                    <h2 className="auth-title">Đổi mật khẩu</h2>
                    <p className="auth-sub">Nhập mật khẩu mới của bạn</p>

                    <Form
                        name="changePassword"
                        className="auth-form"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Mật khẩu mới:"
                            name="MatKhau"
                            className="auth-input"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            label="Xác nhận mật khẩu:"
                            name="confirmPassword"
                            className="auth-input"
                            dependencies={["MatKhau"]}
                            rules={[
                                { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("MatKhau") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("Mật khẩu không khớp!"));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block className="custom-button">
                                Đổi mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="register-login-link" style={{ marginTop: "-10px" }}>
                        <a href="/login">Quay lại đăng nhập</a>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ChangePass;

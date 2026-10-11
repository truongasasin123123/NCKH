import { Alert, Button, Checkbox, Form, Input } from 'antd';
import "../style/auth.css";
import ApiAxios, { formatErrorMessage } from '../axios.config';
import { Link, useLocation } from 'react-router-dom';
import { useState } from "react";

interface FormType {
    TaiKhoan: string;
    MatKhau: string;
    remember: boolean;
}

interface LocationState {
    redirectTo?: string;
}

function Login() {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [form] = Form.useForm();
    const location = useLocation();
    const redirectTo = (location.state as LocationState | null)?.redirectTo;

    const onFinish = async (values: FormType) => {
        const { TaiKhoan, MatKhau, remember } = values;

        if (!TaiKhoan || !MatKhau) {
            setErrorMessage("Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage(null);
            const res = await ApiAxios.post("/auth/login", { TaiKhoan, MatKhau });

            if (remember) {
                localStorage.setItem("access_token", res.data.access_token);
            } else {
                localStorage.removeItem("access_token");
                sessionStorage.setItem("access_token", res.data.access_token);
            }

            if (res.data.requiresProfileCompletion) {
                window.location.href = "/complete-profile";
            } else {
                window.location.href = redirectTo || "/home";
            }

        } catch (error: any) {
            const isUnauthorized = error?.response?.status === 401;
            const friendlyMsg = isUnauthorized
                ? "Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."
                : formatErrorMessage(error, "Đăng nhập không thành công. Vui lòng thử lại sau.");

            setErrorMessage(friendlyMsg);
            if (isUnauthorized) {
                form.setFields([
                    {
                        name: 'MatKhau',
                        errors: ['Mật khẩu không chính xác!'],
                    },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-page">
                {/* Logo */}
                <div className="auth-box">
                    <h2 className="auth-title">Chào mừng trở lại</h2>
                    <p className="auth-sub">Đăng nhập vào tài khoản của bạn</p>

                    {errorMessage && (
                        <Alert
                            message={errorMessage}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setErrorMessage(null)}
                            style={{ marginBottom: 18 }}
                        />
                    )}

                    <Form
                        form={form}
                        name="login-form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onValuesChange={() => {
                            if (errorMessage) setErrorMessage(null);
                        }}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Tài khoản:"
                            name="TaiKhoan"
                            labelCol={{ span: 24 }}
                            className="custom-input"
                            rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
                            colon={false}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu:"
                            name="MatKhau"
                            labelCol={{ span: 24 }}
                            className="custom-input"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                            colon={false}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            name="remember"
                            valuePropName="checked"
                            className="check-remember"
                        >
                            <Checkbox>Nhớ tài khoản</Checkbox>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block className="custom-button">
                                Đăng nhập
                            </Button>
                        </Form.Item>

                        <div className="register-login-link" style={{ textAlign: "right" }}>
                            <Link to="/forgot">Quên mật khẩu?</Link>
                        </div>

                        <div className="register-login-link">
                            <span>
                                Chưa có tài khoản?{" "}
                                <Link to="/register">Đăng ký</Link>
                            </span>
                        </div>

                    </Form>
                </div>
            </div>
        </>
    );
}

export default Login;

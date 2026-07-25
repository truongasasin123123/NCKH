import { Button, Checkbox, Form, Input, message } from 'antd';
import "../style/auth.css";
import ApiAxios from '../axios.config';
import { Link } from 'react-router-dom';
import { useState } from "react";

interface FormType {
    TaiKhoan: string;
    MatKhau: string;
    remember: boolean;
}

function Login() {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: FormType) => {
        const { TaiKhoan, MatKhau, remember } = values;

        if (!TaiKhoan || !MatKhau) {
            message.error("Không được để trống!");
            return;
        }

        try {
            setLoading(true);
            const res = await ApiAxios.post("/auth/login", { TaiKhoan, MatKhau });

            if (remember) {
                localStorage.setItem("access_token", res.data.access_token);
            } else {
                localStorage.removeItem("access_token");
                sessionStorage.setItem("access_token", res.data.access_token);
            }

            message.success("Đăng nhập thành công!");
            window.location.href = res.data.requiresProfileCompletion
                ? "/mainhome/profile"
                : "/home";

        } catch (error: any) {
            message.error("Sai tài khoản hoặc mật khẩu!");
            console.log(error);
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

                    <Form
                        name="login-form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
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

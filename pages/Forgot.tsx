import { Form, Input, Button, message } from "antd";
import "../style/auth.css";
import ApiAxios from '../axios.config';
import { useState } from "react";

interface ForgotFormType {
    Email: string;
}

function ForgotPassword() {
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: ForgotFormType) => {
        try {
            setLoading(true);

            await ApiAxios.post("/auth/forgotpassword",{gmail: values.Email.trim(),});
            message.success("Đã gửi thư lấy lại mật khẩu tới " + values.Email);
        } catch (error: any) {
            message.error("Gmail không chính xác!");   
        } finally {
            setLoading(false);  
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log("Failed:", errorInfo);
    };

    return (
        <>
            <div className="auth-page">
                <div className="auth-box">
                    <h2 className="auth-title">Quên mật khẩu</h2>
                    <p className="auth-sub">Nhập email để nhận liên kết đặt lại mật khẩu</p>
                    <Form
                        name="forgot-form"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Email:"
                            name="Email"
                            labelCol={{ span: 24 }}
                            className="custom-input"
                            rules={[
                                { required: true, message: "Vui lòng nhập email!" },
                                { type: "email", message: "Email không hợp lệ!" }
                            ]}
                            colon={false}
                        >
                            <Input placeholder="Nhập email của bạn" />
                        </Form.Item>

                        <Form.Item label={null}>
                            <Button type="primary" htmlType="submit" block loading={loading} className="custom-button">
                                Gửi yêu cầu
                            </Button>
                        </Form.Item>

                        <div className="register-login-link" style={{ marginTop: "-10px" }}>
                            <a href="/login">Quay lại đăng nhập</a>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    );
}

export default ForgotPassword;

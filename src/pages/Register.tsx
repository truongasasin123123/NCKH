import { useState, useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import "../style/auth.css";
import { useNavigate } from "react-router-dom";
import ApiAxios, { formatErrorMessage } from "../axios.config";

interface FormType {
    TenDayDu: string;
    Gmail: string;
    TaiKhoan: string;
    MatKhau: string;
    confirmPassword?: string;
    MaXacThuc: string;
}

function Register() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [sendingOtp, setSendingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        try {
            // Validate trường Gmail và TaiKhoan trước khi gửi OTP
            await form.validateFields(["Gmail", "TaiKhoan"]);
        } catch {
            return;
        }

        const gmail = form.getFieldValue("Gmail");
        const taiKhoan = form.getFieldValue("TaiKhoan");

        setSendingOtp(true);
        try {
            const res = await ApiAxios.post("/auth/send-register-otp", {
                gmail: gmail?.trim(),
                taiKhoan: taiKhoan?.trim(),
            });
            message.success(res.data?.message || "Đã gửi mã xác nhận 6 số đến Gmail của bạn!");
            setIsOtpSent(true);
            setCountdown(60); // Đếm ngược 60s trước khi được gửi lại
        } catch (error: any) {
            const errMsg = formatErrorMessage(error, "Không thể gửi mã xác nhận, vui lòng thử lại");
            message.error(errMsg);
        } finally {
            setSendingOtp(false);
        }
    };

    const onFinish = async (values: FormType) => {
        const { TenDayDu, Gmail, TaiKhoan, MatKhau, MaXacThuc } = values;

        if (!isOtpSent) {
            message.warning("Vui lòng nhấn 'Gửi mã' để nhận mã xác minh qua Gmail trước khi đăng ký!");
            return;
        }

        if (!MaXacThuc || MaXacThuc.trim().length !== 6) {
            message.error("Vui lòng nhập đúng mã xác minh 6 chữ số!");
            return;
        }

        setRegistering(true);
        try {
            const res = await ApiAxios.post("/auth/register", {
                TenDayDu: TenDayDu?.trim(),
                Gmail: Gmail?.trim(),
                TaiKhoan: TaiKhoan?.trim(),
                MatKhau,
                MaXacThuc: MaXacThuc.trim(),
            });
            message.success(`Đăng ký tài khoản ${res.data.TaiKhoan} thành công!`);
            navigate("/login");
        } catch (error: any) {
            const errMsg = formatErrorMessage(error, "Đăng ký không thành công");
            message.error(errMsg);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box auth-box--register">
                <h2 className="auth-title">Tạo tài khoản mới</h2>
                <p className="auth-sub">Điền thông tin bên dưới để tạo tài khoản</p>

                <Form
                    form={form}
                    name="register"
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
                        <Input placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                        label="Tài khoản:"
                        name="TaiKhoan"
                        className="auth-input"
                        rules={[
                            { required: true, message: "Vui lòng nhập tài khoản!" },
                            { pattern: /^[a-zA-Z0-9_.-]+$/, message: "Tài khoản không được chứa dấu hoặc ký tự đặc biệt!" }
                        ]}
                    >
                        <Input placeholder="Tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        label="Gmail:"
                        name="Gmail"
                        className="auth-input"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            { type: "email", message: "Định dạng email không hợp lệ!" }
                        ]}
                    >
                        <Input placeholder="example@gmail.com" />
                    </Form.Item>

                    <Form.Item
                        label="Mã xác minh Gmail (6 số):"
                        required
                        style={{ marginBottom: 24 }}
                    >
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Form.Item
                                name="MaXacThuc"
                                noStyle
                                rules={[
                                    { required: true, message: "Vui lòng nhập mã xác minh 6 số!" },
                                    { len: 6, message: "Mã xác minh phải đúng 6 chữ số!" }
                                ]}
                            >
                                <Input
                                    placeholder="Nhập mã 6 số"
                                    maxLength={6}
                                    style={{ height: "36px", borderRadius: "8px" }}
                                />
                            </Form.Item>
                            <Button
                                type="default"
                                icon={<MailOutlined />}
                                onClick={handleSendOtp}
                                loading={sendingOtp}
                                disabled={countdown > 0}
                                style={{
                                    height: "36px",
                                    borderRadius: "8px",
                                    whiteSpace: "nowrap",
                                    color: countdown > 0 ? "#8c8c8c" : "#018f01",
                                    borderColor: countdown > 0 ? "#d9d9d9" : "#018f01",
                                    fontWeight: 500,
                                }}
                            >
                                {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi mã"}
                            </Button>
                        </div>
                        {isOtpSent && (
                            <span style={{ fontSize: "12px", color: "#52c41a", display: "block", marginTop: "4px" }}>
                                Đã gửi mã xác minh đến email. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác/spam).
                            </span>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu:"
                        name="MatKhau"
                        className="custom-input"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu!" },
                            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" }
                        ]}
                    >
                        <Input.Password placeholder="Tối thiểu 6 ký tự" />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu:"
                        name="confirmPassword"
                        className="custom-input"
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
                        <Input.Password placeholder="Nhập lại mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            className="custom-button"
                            loading={registering}
                        >
                            Đăng ký
                        </Button>
                    </Form.Item>

                    <div className="register-login-link">
                        <span>
                            Đã có tài khoản? <a href="/login">Đăng nhập</a>
                        </span>
                    </div>
                </Form>
            </div>
        </div>
    );
}

export default Register;

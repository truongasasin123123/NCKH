import { Form, Input, Button, message } from "antd";
import "../style/auth.css";
import { useNavigate } from "react-router-dom";
import ApiAxios from "../axios.config";


interface FormType {
    TenDayDu: string;
    Gmail: string;
    TaiKhoan: string;
    MatKhau: string;
}

function Register() {
    const navigate = useNavigate();

    const onFinish = async (values: FormType) => {

        const {TenDayDu, Gmail, TaiKhoan, MatKhau } = values;
        if (!TaiKhoan || !MatKhau || !Gmail) {
            message.error('Không được để trống!');
            console.log(TaiKhoan, MatKhau, Gmail);
            return;
        }

        //tuong tac be
        try {
            const res = await ApiAxios.post("/auth/register", {TenDayDu, Gmail, TaiKhoan, MatKhau });
            message.success(`Đăng kí tài khoản ${res.data.TaiKhoan} thành công!`);
            navigate("/login");
        }
        catch (error: any) {
            message.error("Tài khoản đã tồn tại");
            console.log(error)
        }
    };

    return (
        <>
            <div className="auth-page">
                <div className="auth-box auth-box--register">
                    <h2 className="auth-title">Tạo tài khoản mới</h2>
                    <p className="auth-sub">Điền thông tin bên dưới để tạo tài khoản</p>

                    <Form
                        name="register"
                        className="auth-form"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Tên đầy đủ"
                            name="TenDayDu"
                            className="custom-input"
                            rules={[{ required: true, message: "Vui lòng nhập tên đầy đủ!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Gmail:"
                            name="Gmail"
                            className="custom-input"
                            rules={[
                                { type: "email", message: "Sai định dạng email" },
                                { required: true, message: "Vui lòng nhập gmail!" },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Tài khoản:"
                            name="TaiKhoan"
                            className="custom-input"
                            rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu:"
                            name="MatKhau"
                            className="custom-input"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                        >
                            <Input.Password/>
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
                            <Input.Password />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block className="custom-button">
                                Đăng ký
                            </Button>
                        </Form.Item>

                        <div className="register-login-link">
                            <span>Đã có tài khoản?
                                <a href="/login"> Đăng nhập
                                </a>
                            </span>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    );
}

export default Register;

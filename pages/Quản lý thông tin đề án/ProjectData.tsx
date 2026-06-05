import { Form, Input, Select, InputNumber, Progress, Button } from "antd";

export default function ProjectForm() {
    return (
        <Form layout="vertical">
            <Form.Item label="Tên đề án" name="name">
                <Input />
            </Form.Item>

            <Form.Item label="Phân loại" name="type">
                <Select options={[
                    { value: "cap_truong", label: "Cấp trường" },
                    { value: "cap_bo", label: "Cấp bộ" },
                ]} />
            </Form.Item>

            <Form.Item label="Lĩnh vực chuyên môn" name="field">
                <Input />
            </Form.Item>

            <Form.Item label="Chủ nhiệm" name="leader">
                <Input />
            </Form.Item>

            <Form.Item label="Thành viên tham gia" name="members">
                <Select mode="tags" />
            </Form.Item>

            <Form.Item label="Kinh phí (VNĐ)" name="budget">
                <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Tiến độ">
                <Progress percent={70} />
            </Form.Item>

            <Button type="primary">Lưu thông tin</Button>
        </Form>
    );
}

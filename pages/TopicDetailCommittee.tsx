import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Spin, Button, Tag, Card, Row, Col, List,
    message, Modal, Input, Divider, Form
} from 'antd';
import {
    ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined, SaveOutlined, CloseOutlined,
} from '@ant-design/icons';
import { getTopicById, getMemberByid } from './Quản lý thông tin đề án/TopicService';
import type { TopicLoad, ThanhVienDT } from './Quản lý thông tin đề án/TopicService';
import ApiAxios from '../axios.config';

const TopicDetailCommittee: React.FC = () => {
    const { MaDT } = useParams<{ MaDT: string }>();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<TopicLoad | null>(null);
    const [members, setMembers] = useState<ThanhVienDT[]>([]);
    const [loading, setLoading] = useState(true);

    // State cho modal phê duyệt
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveNote, setApproveNote] = useState('');

    // State cho modal từ chối
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [editingBudget, setEditingBudget] = useState(false);
    const [budgetForm] = Form.useForm();
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCommentSubmit = () => {
        if (!commentText.trim()) {
            message.warning('Vui lòng nhập nhận xét');
            return;
        }
        setComments((prev) => [commentText.trim(), ...prev]);
        setCommentText('');
        message.success('Đã thêm nhận xét');
    };

    useEffect(() => {
        fetchTopicDetail();
    }, [MaDT]);

    const fetchTopicDetail = async () => {
        if (!MaDT) {
            message.error('Mã đề tài không hợp lệ');
            navigate('/mainhome');
            return;
        }
        try {
            setLoading(true);
            const data = await getTopicById(MaDT);
            const memData = await getMemberByid(MaDT);
            if (data) {
                setTopic(data);
                setMembers(memData);
            } else {
                message.error('Không tìm thấy đề tài');
                navigate('/mainhome');
            }
        } catch (error) {
            message.error('Lỗi khi tải chi tiết đề tài');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            "Bắt đầu": { color: 'green', label: 'Bắt đầu' },
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: 'Không xác định' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    // Xử lý phê duyệt
    const handleApprove = () => {
        if (!topic) return;
        // TODO: Gọi API cập nhật trạng thái
        setTopic({ ...topic, TrangThai: 'Đã phê duyệt' }); // ← cập nhật state local
        message.success('Đã phê duyệt đề tài thành công!');
        setApproveModalOpen(false);
        setApproveNote('');
        // Tự động kéo xuống phần chỉnh sửa kinh phí
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };
    // Thêm hàm xử lý này
    const handleBudgetSubmit = (values: any) => {
        if (!topic) return;
        const updatedTopic = { ...topic, ...values };
        setTopic(updatedTopic);
        setEditingBudget(false);
        message.success('Cập nhật thông tin thành công!');
        // TODO: Gọi API lưu xuống backend
    };
    // Xử lý từ chối
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            // Tìm trưởng nhóm từ danh sách thành viên
            const truongNhom = topic!.ThanhVienDT.find(
                (tv) => tv.VaiTroDT === 'Nhóm trưởng'
            );
            console.log('Trưởng nhóm:', truongNhom);
            console.log('Danh sách thành viên:', topic!.ThanhVienDT);

            if (!truongNhom) {
                message.warning('Không tìm thấy trưởng nhóm của đề tài này');
                return;
            }
            // 1. Gọi API tạo thông báo đến người gửi đề tài
            await ApiAxios.post('/notifications/createnotifi', {
                TkNguoiNhan: truongNhom.TaiKhoan, // tài khoản người gửi đề tài
                TieuDe: 'Đề tài của bạn đã bị từ chối',
                NoiDung: `Đề tài "${topic?.TenDT}" đã bị từ chối. Lý do: ${rejectReason}`,
            });

            // 2. Gọi API xóa đề tài khỏi database
            await ApiAxios.delete(`/api/detai/${topic?.MaDT}`);
            message.error('Đã từ chối và xóa đề tài');
            setRejectModalOpen(false);
            setRejectReason('');
            fetchTopicDetail();

        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
            <Spin spinning={loading}>
                {topic && (
                    <>
                        {/* Nút quay lại */}
                        <div style={{ marginBottom: 20 }}>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/mainhome')}
                                style={{ marginBottom: 16 }}
                            >
                                Quay lại
                            </Button>
                        </div>


                        <Card style={{ marginBottom: 16 }}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={18}>
                                    <h1 style={{ margin: '0 0 16px 0' }}>{topic.TenDT}</h1>
                                    <div style={{ marginBottom: 12 }}>
                                        {getStatusTag(topic.TrangThai)}
                                    </div>
                                </Col>
                                <Col xs={24} md={6}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            block
                                            onClick={() => setApproveModalOpen(true)}
                                        >
                                            Phê duyệt đề tài
                                        </Button>


                                        <Button
                                            danger
                                            icon={<CloseCircleOutlined />}
                                            block
                                            onClick={() => setRejectModalOpen(true)}
                                        >
                                            Từ chối phê duyệt
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card>


                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Card title="Thông tin cơ bản">
                                    <p><strong>Mã đề tài:</strong> #{topic.MaDT}</p>
                                    <p><strong>Danh mục:</strong> {topic.PhanLoai}</p>

                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title="Mô tả" >
                                    <p>{topic.MoTa || 'Chưa có mô tả'}</p>
                                </Card>
                            </Col>
                        </Row>



                        <Card title="Thành viên nhóm" style={{ marginTop: 16 }}>
                            {members && members.length > 0 ? (
                                <List
                                    dataSource={members}
                                    renderItem={(member, index) => (
                                        <List.Item>
                                            <span>{index + 1}. {member.TaiKhoan} - {member.VaiTroDT}</span>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <p>Chưa có thành viên</p>
                            )}
                        </Card>


                        <div ref={scrollRef}>
                            <Card
                                title="Thời gian"
                                style={{ marginTop: 16 }}
                                extra={
                                    topic.TrangThai === 'Đã phê duyệt' && (
                                        !editingBudget ? (
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    budgetForm.setFieldsValue({
                                                        
                                                        NgayBatDau: topic.NgayBatDau
                                                            ? new Date(topic.NgayBatDau).toISOString().split('T')[0]
                                                            : '',
                                                        NgayKetThuc: topic.NgayKetThuc
                                                            ? new Date(topic.NgayKetThuc).toISOString().split('T')[0]
                                                            : '',
                                                    });
                                                    setEditingBudget(true);
                                                }}
                                            >
                                                Chỉnh sửa
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={() => setEditingBudget(false)}
                                            >
                                                Hủy
                                            </Button>
                                        )
                                    )
                                }
                            >
                                {!editingBudget ? (
                                    // Chế độ xem
                                    <Row gutter={[16, 0]}>
                                        
                                        <Col xs={24} md={8}>
                                            <p>
                                                <strong>Ngày bắt đầu:</strong>{' '}
                                                {topic.NgayBatDau
                                                    ? new Date(topic.NgayBatDau).toLocaleDateString('vi-VN')
                                                    : '-'}
                                            </p>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <p>
                                                <strong>Ngày kết thúc:</strong>{' '}
                                                {topic.NgayKetThuc
                                                    ? new Date(topic.NgayKetThuc).toLocaleDateString('vi-VN')
                                                    : '-'}
                                            </p>
                                        </Col>
                                    </Row>
                                ) : (
                                    // Chế độ chỉnh sửa
                                    <Form form={budgetForm} onFinish={handleBudgetSubmit} layout="vertical">
                                        <Row gutter={[16, 0]}>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label="Ngày bắt đầu"
                                                    name="NgayBatDau"
                                                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                                                >
                                                    <Input type="date" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label="Ngày kết thúc"
                                                    name="NgayKetThuc"
                                                    rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
                                                >
                                                    <Input type="date" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col>
                                                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                                    Lưu thay đổi
                                                </Button>
                                            </Col>
                                            <Col>
                                                <Button danger icon={<CloseOutlined />} onClick={() => setEditingBudget(false)}>
                                                    Hủy
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                )}
                            </Card>
                        </div>

                        <Card title="Nhận xét" style={{ marginTop: 16 }}>
                            <Form layout="vertical" onFinish={handleCommentSubmit}>
                                <Form.Item label="Ý kiến của hội đồng">
                                    <Input.TextArea
                                        rows={4}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Nhập nhận xét về đề tài..."
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Gửi nhận xét
                                    </Button>
                                </Form.Item>
                            </Form>

                            <Divider />
                            {comments.length > 0 && comments.map((comment, index) => (
                                <Card type="inner" size="small" key={index} style={{ marginBottom: 12 }}>
                                    <p style={{ marginBottom: 8 }}><strong>Nhận xét {comments.length - index}:</strong></p>
                                    <p style={{ margin: 0 }}>{comment}</p>
                                </Card>
                            ))}
                        </Card>

                        {/* Modal Phê duyệt */}
                        <Modal
                            title="Xác nhận phê duyệt đề tài"
                            open={approveModalOpen}
                            onCancel={() => {
                                setApproveModalOpen(false);
                                setApproveNote('');
                            }}
                            footer={[
                                <Button key="cancel" onClick={() => setApproveModalOpen(false)}>
                                    Hủy
                                </Button>,
                                <Button
                                    key="approve"
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleApprove}
                                >
                                    Xác nhận phê duyệt
                                </Button>,
                            ]}
                        >
                            <p>Bạn có chắc chắn muốn <strong>phê duyệt</strong> đề tài <strong>{topic.TenDT}</strong> không?</p>
                            <Divider />
                            <p style={{ marginBottom: 8 }}>Ghi chú (tùy chọn):</p>
                            <Input.TextArea
                                rows={4}
                                placeholder="Nhập ghi chú phê duyệt..."
                                value={approveNote}
                                onChange={(e) => setApproveNote(e.target.value)}
                            />
                        </Modal>

                        {/* Modal Từ chối */}
                        <Modal
                            title="Từ chối phê duyệt đề tài"
                            open={rejectModalOpen}
                            onCancel={() => {
                                setRejectModalOpen(false);
                                setRejectReason('');
                            }}
                            footer={[
                                <Button key="cancel" onClick={() => setRejectModalOpen(false)}>
                                    Hủy
                                </Button>,
                                <Button
                                    key="reject"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={handleReject}
                                >
                                    Xác nhận từ chối
                                </Button>,
                            ]}
                        >
                            <p>Bạn sắp <strong>từ chối</strong> đề tài <strong>{topic.TenDT}</strong>.</p>
                            <Divider />
                            <p style={{ marginBottom: 8 }}>
                                Lý do từ chối <span style={{ color: 'red' }}>*</span>:
                            </p>
                            <Input.TextArea
                                rows={4}
                                placeholder="Nhập lý do từ chối (bắt buộc)..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </Modal>
                    </>
                )}
            </Spin>
        </div>
    );
};

export default TopicDetailCommittee;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Tag, Card, Row, Col, List, message, Modal, Input, Divider, Form, Upload, Select, Radio } from 'antd';
import {DownloadOutlined, ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined, SendOutlined, UploadOutlined, BarChartOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { getTopicById, getMemberByid, getUsersByRole } from './Quản lý thông tin đề án/TopicService';
import { getTopicProgress } from './Quản lý thông tin đề án/ProgressService';
import type { TopicLoad, ThanhVienDT } from './Quản lý thông tin đề án/TopicService';

interface NguoiNhanOption {
    value: string
    label: string
}

interface ReviewerApproval {
    name: string
    approved: boolean
}

const TopicDetail: React.FC = () => {
    const { MaDT } = useParams<{ MaDT: string }>(); // Sử dụng MaDT thay vì id
    const navigate = useNavigate();
    const [fetching, setFetching] = useState(false);
    const [topic, setTopic] = useState<TopicLoad | null>(null);
    const [members, setMembers] = useState<ThanhVienDT[]>([]); // Thêm state cho members
    const [loading, setLoading] = useState(true);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [submitNotes, setSubmitNotes] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]);
    const [projectDocuments, setProjectDocuments] = useState<Array<{ name: string; url: string; source: string; date?: string }>>([]);
    const [progressDocsLoading, setProgressDocsLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [targetGroup, setTargetGroup] = useState<'hoidong' | 'huongdan' | null>(null);
    const [selectedReviewer, setSelectedReviewer] = useState<string[]>([]);
    const [committeeOptions, setCommitteeOptions] = useState<NguoiNhanOption[]>([]);
    const [advisorOptions, setAdvisorOptions] = useState<NguoiNhanOption[]>([]);
    const [approvalStatus, setApprovalStatus] = useState<ReviewerApproval[]>([]);
    

    const reviewerOptions = targetGroup === 'hoidong' ? committeeOptions : targetGroup === 'huongdan' ? advisorOptions : [];
    const approvedCount = approvalStatus.filter((r) => r.approved).length;
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTopicDetail();
        fetchUsers();
    }, [MaDT]);

    const handleDownloadFile = (fileUrl?: string) => {
        if (!fileUrl) {
          message.warning('Chưa có file đính kèm');
          return;
        }
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileUrl.split('/').pop() || 'tep-dinh-kem';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

    const fetchTopicDetail = async () => {
        if (!MaDT) {
            message.error('Mã đề tài không hợp lệ');
            navigate('/mainhome');
            return;
        }

        try {
            setLoading(true);
            const data = await getTopicById(MaDT);
            const memData = await getMemberByid(MaDT); // Lấy members
            if (data) {
                setTopic(data);
                setMembers(memData);
                await fetchProjectDocuments(MaDT);
                form.setFieldsValue({
                    TenDT: data.TenDT,
                    PhanLoai: data.PhanLoai,
                    NgayBatDau: data.NgayBatDau ? new Date(data.NgayBatDau).toISOString().split('T')[0] : '',
                    NgayKetThuc: data.NgayKetThuc ? new Date(data.NgayKetThuc).toISOString().split('T')[0] : '',
                    MoTa: data.MoTa,
                    // objectives, methods, progress không có trong API, nên bỏ qua
                });
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

    const fetchProjectDocuments = async (maDT: string) => {
        try {
            setProgressDocsLoading(true);
            const progressData = await getTopicProgress(maDT);
            const documents = progressData.CapNhatTienDo
                .filter((update) => update.TepDinhKem)
                .map((update) => ({
                    name: update.TepDinhKem?.split('/').pop() || update.MaCapNhat,
                    url: update.TepDinhKem as string,
                    source: 'Tiến độ',
                    date: update.NgayCapNhat ? new Date(update.NgayCapNhat).toLocaleDateString('vi-VN') : undefined,
                }));
            setProjectDocuments(documents);
        } catch (error) {
            console.error(error);
        } finally {
            setProgressDocsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setFetching(true);
            const hoidong = await getUsersByRole("Hội đồng");
            const huongdan = await getUsersByRole("Người hướng dẫn");
            setCommitteeOptions(hoidong);
            setAdvisorOptions(huongdan);
        } catch (error) {
            message.error("Lỗi khi tải danh sách người nhận");
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            "Đã phê duyệt": { color: 'green', label: 'Bắt đầu' },
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: 'Không xác định' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    const handleEditSubmit = (values: any) => {
        if (!topic) return;
        const updatedTopic = { ...topic, ...values };
        setTopic(updatedTopic);
        setEditing(false);
        message.success('Cập nhật đề tài thành công!');
    };

    const handleCancelEdit = () => {
        setEditing(false);
        if (topic) {
            form.setFieldsValue({
                TenDT: topic.TenDT,
                PhanLoai: topic.PhanLoai,
                NgayBatDau: topic.NgayBatDau ? new Date(topic.NgayBatDau).toISOString().split('T')[0] : '',
                NgayKetThuc: topic.NgayKetThuc ? new Date(topic.NgayKetThuc).toISOString().split('T')[0] : '',
                MoTa: topic.MoTa,
            });
        }
    };

    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
            <Spin spinning={loading}>
                {topic && (
                    <>
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
                                    <div>
                                        <h1 style={{ margin: '0 0 16px 0' }}>{topic.TenDT}</h1>
                                        <div style={{ marginBottom: 12 }}>
                                            {getStatusTag(topic.TrangThai)}
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={6}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {!editing ? (
                                            <Button
                                                type="primary"
                                                icon={<EditOutlined />}
                                                block
                                                onClick={() => setEditing(true)}
                                            >
                                                Chỉnh sửa đề tài
                                            </Button>
                                        ) : (
                                            <Button
                                                type="default"
                                                icon={<CloseOutlined />}
                                                block
                                                onClick={handleCancelEdit}
                                            >
                                                Hủy chỉnh sửa
                                            </Button>
                                        )}
                                        <Button
                                            type="dashed"
                                            icon={<SendOutlined />}
                                            block
                                            onClick={() => setSubmitModalOpen(true)}
                                        >
                                            Gửi hội đồng
                                        </Button>
                                        {topic?.TrangThai === 'Đã phê duyệt' && (
                                            <Button
                                                type="default"
                                                icon={<BarChartOutlined />}
                                                block
                                                onClick={() => navigate(`/mainhome/progress/${MaDT}`)}
                                            >
                                                Quản lý tiến độ
                                            </Button>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {editing ? (
                            <Form form={form} onFinish={handleEditSubmit} layout="vertical">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Card title="Thông tin cơ bản">
                                            <Form.Item
                                                label="Tên đề tài"
                                                name="TenDT"
                                                rules={[{ required: true, message: 'Vui lòng nhập tên đề tài' }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Form.Item
                                                label="Danh mục"
                                                name="PhanLoai"
                                                rules={[{ required: true, message: 'Vui lòng nhập danh mục' }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Form.Item
                                                label="Ngày bắt đầu"
                                                name="NgayBatDau"
                                            >
                                                <Input type="date" disabled />
                                            </Form.Item>
                                            <Form.Item
                                                label="Hạn chót"
                                                name="NgayKetThuc"
                                                rules={[{ required: true, message: 'Vui lòng nhập hạn chót' }]}
                                            >
                                                <Input type="date" disabled />
                                            </Form.Item>
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Card title="Trạng thái">
                                            <Form.Item label="Trạng thái" name="TrangThai">
                                                <Input disabled />
                                            </Form.Item>
                                        </Card>
                                    </Col>
                                </Row>

                                <Card title="Mô tả" style={{ marginTop: 16 }}>
                                    <Form.Item
                                        label="Mô tả"
                                        name="MoTa"
                                    >
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                </Card>



                                <Row gutter={16} style={{ marginTop: 16 }}>
                                    <Col>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                            Lưu thay đổi
                                        </Button>
                                    </Col>
                                    <Col>
                                        <Button danger icon={<CloseOutlined />} onClick={handleCancelEdit}>
                                            Hủy
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        ) : (
                            <>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Card title="Thông tin cơ bản">
                                            <p>
                                                <strong>Mã đề tài:</strong> #{topic.MaDT}
                                            </p>
                                            <p>
                                                <strong>Danh mục:</strong> {topic.PhanLoai}
                                            </p>
                                            <p>
                                                <strong>Ngày bắt đầu:</strong> {topic.NgayBatDau ? new Date(topic.NgayBatDau).toLocaleDateString('vi-VN') : '-'}
                                            </p>
                                            <p>
                                                <strong>Hạn chót:</strong> {topic.NgayKetThuc ? new Date(topic.NgayKetThuc).toLocaleDateString('vi-VN') : '-'}
                                            </p>
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Card title="Trạng thái">
                                            {approvalStatus.length > 0 ? (
                                                <>
                                                    <p>
                                                        <strong>Đã phê duyệt:</strong> {approvedCount}/{approvalStatus.length}
                                                    </p>
                                                    <List
                                                        dataSource={approvalStatus}
                                                        renderItem={(reviewer, index) => (
                                                            <List.Item>
                                                                <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                                    <span>{index + 1}. {reviewer.name}</span>
                                                                    <Tag color={reviewer.approved ? 'green' : 'blue'}>
                                                                        {reviewer.approved ? 'Đã phê duyệt' : 'Chưa phê duyệt'}
                                                                    </Tag>
                                                                </span>
                                                            </List.Item>
                                                        )}
                                                    />
                                                </>
                                            ) : (
                                                <p>Chưa có trạng thái phê duyệt nào. Vui lòng gửi cho hội đồng để được phê duyệt.</p>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>

                                <Card title="Mô tả" style={{ marginTop: 16 }}>
                                    <p>{topic.MoTa || 'Chưa có mô tả'}</p>
                                </Card>

                                <Card title="Tổng hợp tài liệu dự án" style={{ marginTop: 16 }}>
                                    {progressDocsLoading ? (
                                        <p>Đang tải tài liệu...</p>
                                    ) : projectDocuments.length > 0 ? (
                                        <List
                                            dataSource={projectDocuments}
                                            renderItem={(doc) => (
                                                <List.Item>
                                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                                                        <div>
                                                            <strong>{doc.name}</strong>
                                                            <div style={{ color: '#666', fontSize: 12 }}>{doc.source}{doc.date ? ` · ${doc.date}` : ''}</div>
                                                        </div>
                                                        <div style={{gap: 8, display: 'flex'}}>
                                                        <Button
                                                            type="primary"
                                                            icon={<EyeOutlined />}
                                                            className="btn-see-upload"
                                                        >
                                                            Xem
                                                        </Button>
                                                        <Button
                                                            type="primary"
                                                            icon={<DownloadOutlined />}
                                                            className="btn-see-upload"
                                                            
                                                        >
                                                            Tải xuống
                                                        </Button>
                                                        </div>
                                                    </div>
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <p>Chưa có tài liệu dự án từ tiến độ.</p>
                                    )}
                                </Card>

                            </>
                        )}

                        {!editing && (
                            <>


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
                            </>
                        )}


                        <Modal
                            title="GỬI ĐỀ TÀI LÊN HỘI ĐỒNG ĐÁNH GIÁ"
                            open={submitModalOpen}
                            onCancel={() => {
                                setSubmitModalOpen(false);
                                setSubmitNotes('');
                                setAttachedFiles([]);
                                setTargetGroup(null);
                                setSelectedReviewer([]);
                            }}
                            footer={[
                                <Button
                                    key="cancel"
                                    danger
                                    onClick={() => {
                                        setSubmitModalOpen(false);
                                        setSubmitNotes('');
                                        setAttachedFiles([]);
                                        setSelectedReviewer([]);
                                    }}
                                >
                                    Đóng
                                </Button>,
                                <Button
                                    key="submit"
                                    type="primary"
                                    onClick={() => {
                                        if (!targetGroup) {
                                            message.warning('Vui lòng chọn loại nhận (Hội đồng hoặc Người hướng dẫn)');
                                            return;
                                        }
                                        if (!selectedReviewer || selectedReviewer.length === 0) {
                                            message.warning('Vui lòng chọn hội đồng hoặc người hướng dẫn trước khi gửi');
                                            return;
                                        }

                                        const chosenReviewers = reviewerOptions.filter((r) => selectedReviewer.includes(r.value));
                                        const chosenLabels = chosenReviewers.map((r) => r.label).join(', ');

                                        setTopic((prev) => prev ? { ...prev, TrangThai: 'Chờ phê duyệt' } : prev);
                                        setApprovalStatus(chosenReviewers.map((r) => ({ name: r.label, approved: false })));

                                        message.success(`Đã gửi đề tài cho: ${chosenLabels}`);
                                        setSubmitModalOpen(false);
                                        setSubmitNotes('');
                                        setAttachedFiles([]);
                                        setTargetGroup(null);
                                        setSelectedReviewer([]);
                                    }}
                                >
                                    Gửi
                                </Button>,
                            ]}
                            width={900}
                        >
                            {topic && (
                                <div>
                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ marginBottom: 8 }}>
                                            <strong>Tên đề tài:</strong> {topic.TenDT}
                                        </p>
                                        <p style={{ marginBottom: 8 }}>
                                            <strong>Danh mục:</strong> {topic.PhanLoai}
                                        </p>
                                        <p style={{ marginBottom: 8 }}>
                                            <strong>Trạng thái:</strong> {topic.TrangThai}
                                        </p>
                                        <p style={{ marginBottom: 8 }}>
                                            <strong>Hạn chót:</strong> {topic.NgayKetThuc ? new Date(topic.NgayKetThuc).toLocaleDateString('vi-VN') : '-'}
                                        </p>

                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Mô tả:</p>
                                        <div
                                            style={{
                                                padding: 12,
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: 4,
                                                minHeight: 80,
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word',
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {topic.MoTa}
                                        </div>
                                    </div>

                                    <Divider />

                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Gửi tới</p>
                                        <Radio.Group
                                            onChange={(e) => {
                                                setTargetGroup(e.target.value);
                                                setSelectedReviewer([]);
                                            }}
                                            value={targetGroup}
                                            options={[
                                                { label: 'Hội đồng', value: 'hoidong' },
                                                { label: 'Người hướng dẫn', value: 'huongdan' },
                                            ]}
                                            optionType="button"
                                            buttonStyle="solid"
                                        />
                                    </div>
                                    {/* loc nguoi gui */}
                                    {targetGroup && (
                                        <div style={{ marginBottom: 24 }}>
                                            <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Chọn {targetGroup === 'hoidong' ? 'hội đồng' : 'người hướng dẫn'}</p>
                                            <Select
                                                mode='multiple'
                                                showSearch
                                                placeholder={targetGroup === 'hoidong' ? 'Chọn hội đồng' : 'Chọn người hướng dẫn'}
                                                options={reviewerOptions}
                                                value={selectedReviewer}
                                                onChange={(value: string[]) => setSelectedReviewer(value)}
                                                notFoundContent={fetching ? "Đang tìm..." : "Không có kết quả"}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 24 }}>
                                        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Ghi chú (Tùy chọn):</p>
                                        <Input.TextArea
                                            rows={5}
                                            placeholder="Nhập ghi chú hoặc lý do gửi đề tài..."
                                            value={submitNotes}
                                            onChange={(e) => setSubmitNotes(e.target.value)}
                                            style={{ borderRadius: 4 }}
                                        />
                                    </div>

                                    <Divider />

                                    <div>
                                        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Đính kèm tài liệu:</p>
                                        <Upload
                                            listType="picture"
                                            multiple
                                            onChange={(info: any) => setAttachedFiles(info.fileList)}
                                            beforeUpload={() => false}
                                        >
                                            <Button icon={<UploadOutlined />}>
                                                Chọn tệp
                                            </Button>
                                        </Upload>
                                        {attachedFiles.length > 0 && (
                                            <p style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
                                                Số tệp đã chọn: {attachedFiles.length}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Modal>
                    </>
                )}
            </Spin>
        </div>
    );
};

export default TopicDetail;
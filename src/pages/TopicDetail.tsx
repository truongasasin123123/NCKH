import React, { useState, useEffect } from 'react';
import type { CollapseProps } from 'antd';
import { Collapse, Spin, Button, Tag, Card, Row, Col, List, message, Modal, Input, Divider, Form, Upload, Radio, Space, Popconfirm } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { DownloadOutlined, ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined, SendOutlined, UploadOutlined, BarChartOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { getTopicById, getMemberByTopic, getProjectApprovals, submitProjectForApproval, updateProject } from './Quản lý thông tin đề án/TopicService';
import type { TopicLoad, ThanhVienDT } from './Quản lý thông tin đề án/TopicService';
import { downloadDocument, getDocumentsByTopic, uploadDocument } from './Quản lý thông tin đề án/DocumentsService';
import { createProjectComment, deleteProjectComment, getProjectComments, updateProjectComment } from './Quản lý thông tin đề án/CommentsService';
import type { ProjectComment } from './Quản lý thông tin đề án/CommentsService';

interface ReviewerApproval {
    account: string
    name: string
    status: string
    responseDate?: string
    councilType: 'Xét duyệt' | 'Chấm điểm'
}

interface JwtPayload {
    TaiKhoan?: string;
    VaiTro?: string;
    role?: string;
}

const TopicDetail: React.FC = () => {
    const { MaDT } = useParams<{ MaDT: string }>(); // Sử dụng MaDT thay vì id
    const navigate = useNavigate();
    const [topic, setTopic] = useState<TopicLoad | null>(null);
    const [members, setMembers] = useState<ThanhVienDT[]>([]); // Thêm state cho members
    const [loading, setLoading] = useState(true);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [submitNotes, setSubmitNotes] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]);
    const [projectDocuments, setProjectDocuments] = useState<Array<{ id: number; name: string; source: string; date?: string }>>([]);
    const [progressDocsLoading, setProgressDocsLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<ReviewerApproval[]>([]);
    const [submittedCouncilTypes, setSubmittedCouncilTypes] = useState<Array<'Xét duyệt' | 'Chấm điểm'>>([]);
    const [councilType, setCouncilType] = useState<'approval' | 'scoring'>('approval');
    const [projectComments, setProjectComments] = useState<ProjectComment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
    const displayRole = user?.VaiTro || user?.role || '';
    const isCommitteeRole = displayRole.toLowerCase().includes('hội đồng') || displayRole.toLowerCase().includes('hoidong');
    const normalizedRole = displayRole
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd');
    const canComment = normalizedRole.includes('hoi dong') || normalizedRole.includes('nguoi huong dan');

    const approvalReviewers = approvalStatus.filter((reviewer) => reviewer.councilType === 'Xét duyệt');
    const approvedCount = approvalReviewers.filter((reviewer) => reviewer.status === 'Đã phê duyệt').length;
    const hasSubmittedForApproval = submittedCouncilTypes.includes('Xét duyệt');
    const hasSubmittedForScoring = submittedCouncilTypes.includes('Chấm điểm');
    const canSendToCouncil = !hasSubmittedForApproval
        || (topic?.TrangThai === 'Đã phê duyệt' && !hasSubmittedForScoring);
    const isTopicLeader = members.some((member) =>
        member.TaiKhoan === user?.TaiKhoan && member.VaiTroDT === 'Nhóm trưởng',
    );
    const canEditProject = topic?.TrangThai === 'Nháp' && isTopicLeader;
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTopicDetail();
    }, [MaDT]);

    useEffect(() => {
        if (!MaDT) return;

        const refreshInterval = window.setInterval(async () => {
            try {
                const [latestTopic] = await Promise.all([
                    getTopicById(MaDT),
                    fetchApprovalStatus(MaDT),
                    fetchComments(MaDT),
                ]);
                setTopic(latestTopic);
            } catch (error) {
                console.error('Lỗi khi tự cập nhật trạng thái xét duyệt:', error);
            }
        }, 5000);

        return () => window.clearInterval(refreshInterval);
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
            const memData = await getMemberByTopic(MaDT); // Lấy members
            if (data) {
                setTopic(data);
                setMembers(memData);
                await fetchApprovalStatus(MaDT);
                await fetchComments(MaDT);
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

    const itemsNest1: CollapseProps['items'] = [
        {
            key: '1',
            label: 'Ths Nguyễn Văn A',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
        {
            key: '2',
            label: 'Ths Trần Thị B',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
    ];
    const itemsNest2: CollapseProps['items'] = [
        {
            key: '3',
            label: 'Ths Lê Văn C',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
        {
            key: '4',
            label: 'Ths Phạm Thị D',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
    ];
    const itemsNest3: CollapseProps['items'] = [
        {
            key: '5',
            label: 'Ths Đỗ Thị E',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
        {
            key: '6',
            label: 'Ths Hoàng Văn F',
            children: (
                <div>
                    <p> </p>
                    
                </div>
            ),
        },
    ];

    const collapseItems: CollapseProps['items'] = [
        {
            key: 'hoidong-cham',
            label: 'Hội đồng chấm',
            children: <Collapse defaultActiveKey="1" items={itemsNest1} />,
        },
        {
            key: 'hoidong-nghiem-thu',
            label: 'Hội đồng nghiệm thu',
            children: <Collapse defaultActiveKey="1" items={itemsNest2}/>,
        },
        {
            key: 'ghi-chu',
            label: 'Ghi chú',
            children: <Collapse defaultActiveKey="1" items={itemsNest3}/>,
        },
    ];

    const fetchProjectDocuments = async (maDT: string) => {
        try {
            setProgressDocsLoading(true);
            const documents = await getDocumentsByTopic(maDT);
            setProjectDocuments(documents.map((document) => ({
                id: document.MaTL,
                name: document.TenFile,
                source: document.LoaiTaiLieu || 'Tài liệu đề tài',
                date: document.NgayTaiLen
                    ? new Date(document.NgayTaiLen).toLocaleDateString('vi-VN')
                    : undefined,
            })));
        } catch (error) {
            console.error('Lỗi khi tải tài liệu đề tài:', error);
            message.error('Không thể tải tài liệu đề tài');
        } finally {
            setProgressDocsLoading(false);
        }
    };

    const handleSubmitTopic = async () => {
        const isScoringCouncil = councilType === 'scoring';
        if ((!isScoringCouncil && hasSubmittedForApproval) || (isScoringCouncil && hasSubmittedForScoring)) {
            message.warning(`Đề tài đã được gửi Hội đồng ${isScoringCouncil ? 'chấm điểm' : 'xét duyệt'}, không thể gửi lại`);
            return;
        }
        if (isScoringCouncil && topic?.TrangThai !== 'Đã phê duyệt') {
            message.warning('Chỉ được gửi Hội đồng chấm điểm sau khi đề tài đã được phê duyệt');
            return;
        }
        if (!MaDT) {
            message.error('Không xác định được mã đề tài');
            return;
        }

        try {
            await Promise.all(attachedFiles.map((uploadFile) => {
                if (!uploadFile.originFileObj) {
                    throw new Error(`Không đọc được file ${uploadFile.name}`);
                }
                return uploadDocument({
                    file: uploadFile.originFileObj,
                    maDT: MaDT,
                    loaiTaiLieu: 'Tài liệu gửi đánh giá',
                });
            }));

            const result = await submitProjectForApproval(MaDT, councilType, submitNotes);
            if (!isScoringCouncil) {
                setTopic((prev) => prev ? { ...prev, TrangThai: 'Chờ phê duyệt' } : prev);
            }
            const newReviewers = (result.reviewers || []).map((reviewer: {
                account: string;
                name?: string;
                status: string;
                NguoiDung?: { TenDayDu?: string };
                LoaiHoiDong?: 'Xét duyệt' | 'Chấm điểm';
            }) => ({
                account: reviewer.account,
                name: reviewer.name || reviewer.NguoiDung?.TenDayDu || reviewer.account,
                status: reviewer.status,
                councilType: reviewer.LoaiHoiDong || (isScoringCouncil ? 'Chấm điểm' : 'Xét duyệt'),
            }));
            setApprovalStatus((current) => [
                ...current.filter((reviewer) => reviewer.councilType !== (isScoringCouncil ? 'Chấm điểm' : 'Xét duyệt')),
                ...newReviewers,
            ]);
            setSubmittedCouncilTypes((current) => Array.from(new Set([
                ...current,
                isScoringCouncil ? 'Chấm điểm' : 'Xét duyệt',
            ])) as Array<'Xét duyệt' | 'Chấm điểm'>);
            await fetchProjectDocuments(MaDT);

            message.success(`Đã gửi đề tài đến ${newReviewers.length} thành viên Hội đồng ${isScoringCouncil ? 'chấm điểm' : 'xét duyệt'}`);
            setSubmitModalOpen(false);
            setSubmitNotes('');
            setAttachedFiles([]);
        } catch (error: any) {
            message.error(error?.response?.data?.message || error.message || 'Không thể upload tài liệu');
        }
    };

    const fetchApprovalStatus = async (maDT: string) => {
        try {
            const approvals = await getProjectApprovals(maDT);
            setSubmittedCouncilTypes(Array.from(new Set(approvals.map((approval: {
                LoaiHoiDong?: 'Xét duyệt' | 'Chấm điểm';
            }) => approval.LoaiHoiDong || 'Xét duyệt'))) as Array<'Xét duyệt' | 'Chấm điểm'>);
            setApprovalStatus(approvals.map((approval: {
                TaiKhoanHoiDong: string;
                TrangThai: string;
                NgayPhanHoi?: string;
                NguoiDung?: { TenDayDu?: string };
                LoaiHoiDong?: 'Xét duyệt' | 'Chấm điểm';
            }) => ({
                account: approval.TaiKhoanHoiDong,
                name: approval.NguoiDung?.TenDayDu || approval.TaiKhoanHoiDong,
                status: approval.TrangThai,
                responseDate: approval.NgayPhanHoi,
                councilType: approval.LoaiHoiDong || 'Xét duyệt',
            })));
        } catch (error) {
            console.error('Lỗi khi tải trạng thái xét duyệt:', error);
        }
    };

    const fetchComments = async (maDT: string) => {
        try {
            setProjectComments(await getProjectComments(maDT));
        } catch (error) {
            console.error('Lỗi khi tải nhận xét:', error);
        }
    };

    const handleCreateComment = async () => {
        if (!MaDT || !commentInput.trim()) {
            message.warning('Vui lòng nhập nội dung nhận xét');
            return;
        }
        try {
            const created = await createProjectComment(MaDT, commentInput);
            setProjectComments((current) => [created, ...current]);
            setCommentInput('');
            message.success('Đã thêm nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể thêm nhận xét');
        }
    };

    const handleUpdateComment = async (id: number) => {
        if (!editingCommentContent.trim()) {
            message.warning('Nội dung nhận xét không được để trống');
            return;
        }
        try {
            const updated = await updateProjectComment(id, editingCommentContent);
            setProjectComments((current) => current.map((comment) => comment.Id === id ? updated : comment));
            setEditingCommentId(null);
            setEditingCommentContent('');
            message.success('Đã sửa nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể sửa nhận xét');
        }
    };

    const handleDeleteComment = async (id: number) => {
        try {
            await deleteProjectComment(id);
            setProjectComments((current) => current.filter((comment) => comment.Id !== id));
            message.success('Đã xóa nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa nhận xét');
        }
    };

    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            "Nháp": { color: 'default', label: 'Nháp' },
            "Đã phê duyệt": { color: 'green', label: 'Bắt đầu' },
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: 'Không xác định' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    const getApprovalStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            'Đã phê duyệt': { color: 'green', label: 'Đã phê duyệt' },
            'Từ chối': { color: 'red', label: 'Từ chối' },
            'Chờ phê duyệt': { color: 'blue', label: 'Chờ phê duyệt' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: status };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    const handleEditSubmit = async (values: any) => {
        if (!topic) return;

        try {
            const updatedTopic = await updateProject(topic.MaDT, {
                TenDT: values.TenDT,
                PhanLoai: values.PhanLoai,
                MoTa: values.MoTa,
            });
            setTopic(updatedTopic);
            setEditing(false);
            message.success('Cập nhật đề tài thành công!');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể cập nhật đề tài');
        }
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
                                onClick={() => navigate(
                                    isCommitteeRole && topic.TrangThai === 'Đã phê duyệt'
                                        ? '/mainhome/approvedtopics'
                                        : '/mainhome',
                                )}
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
                                {!isCommitteeRole && (
                                    <Col xs={24} md={6}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {!editing && canEditProject ? (
                                                <Button
                                                    type="primary"
                                                    icon={<EditOutlined />}
                                                    block
                                                    onClick={() => setEditing(true)}
                                                >
                                                    Chỉnh sửa đề tài
                                                </Button>
                                            ) : editing ? (
                                                <Button
                                                    type="default"
                                                    icon={<CloseOutlined />}
                                                    block
                                                    onClick={handleCancelEdit}
                                                >
                                                    Hủy chỉnh sửa
                                                </Button>
                                            ) : null}
                                            <Button
                                                type="dashed"
                                                icon={<SendOutlined />}
                                                block
                                                disabled={!canSendToCouncil}
                                                onClick={() => {
                                                    setCouncilType(hasSubmittedForApproval ? 'scoring' : 'approval');
                                                    setSubmitModalOpen(true);
                                                }}
                                            >
                                                {canSendToCouncil ? 'Gửi hội đồng' : 'Đã gửi đủ hội đồng'}
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
                                )}
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
                                                        <strong>Hội đồng xét duyệt đã đồng ý:</strong> {approvedCount}/{approvalReviewers.length}
                                                    </p>
                                                    <List
                                                        dataSource={approvalStatus}
                                                        renderItem={(reviewer, index) => (
                                                            <List.Item>
                                                                <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                                    <span>
                                                                        {index + 1}. {reviewer.name}
                                                                        <Tag style={{ marginLeft: 8 }} color={reviewer.councilType === 'Xét duyệt' ? 'purple' : 'cyan'}>
                                                                            Hội đồng {reviewer.councilType.toLowerCase()}
                                                                        </Tag>
                                                                        {reviewer.name !== reviewer.account && (
                                                                            <span style={{ color: '#8c8c8c' }}> ({reviewer.account})</span>
                                                                        )}
                                                                        {reviewer.responseDate && (
                                                                            <span style={{ color: '#8c8c8c', display: 'block', fontSize: 12 }}>
                                                                                Phản hồi: {new Date(reviewer.responseDate).toLocaleString('vi-VN')}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    {getApprovalStatusTag(reviewer.status)}
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
                                                        <div style={{ gap: 8, display: 'flex' }}>
                                                            <Button
                                                                type="primary"
                                                                icon={<DownloadOutlined />}
                                                                className="btn-see-upload"
                                                                onClick={() => downloadDocument(doc.id, doc.name)}
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
                        <Card title="Tổng hợp điểm" style={{ marginTop: 16 }}>
                            <Collapse items={collapseItems} defaultActiveKey={['hoidong-cham']} />
                        </Card>
                        <Card title="Nhận xét" style={{ marginTop: 16, marginBottom: 24 }}>
                            {canComment && (
                                <div style={{ marginBottom: 16 }}>
                                    <Input.TextArea
                                        rows={4}
                                        placeholder="Nhập nhận xét..."
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                        <Button type="primary" onClick={handleCreateComment}>Thêm nhận xét</Button>
                                    </div>
                                </div>
                            )}
                            <List
                                locale={{ emptyText: 'Chưa có nhận xét' }}
                                dataSource={projectComments}
                                renderItem={(comment) => {
                                    const isAuthor = comment.TaiKhoan === user?.TaiKhoan;
                                    const isEditingComment = editingCommentId === comment.Id;
                                    return (
                                        <List.Item
                                            actions={isAuthor && canComment ? [
                                                <Button key="edit" type="link" onClick={() => { setEditingCommentId(comment.Id); setEditingCommentContent(comment.NoiDung); }}>Sửa</Button>,
                                                <Popconfirm
                                                    key="delete"
                                                    title="Xóa nhận xét"
                                                    description="Bạn có chắc muốn xóa nhận xét này?"
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    okButtonProps={{ danger: true }}
                                                    onConfirm={() => handleDeleteComment(comment.Id)}
                                                >
                                                    <Button type="link" danger>Xóa</Button>
                                                </Popconfirm>,
                                            ] : undefined}
                                        >
                                            <div style={{ width: '100%' }}>
                                                <strong>{comment.NguoiDung?.TenDayDu || comment.TaiKhoan}</strong>
                                                <span style={{ color: '#8c8c8c' }}> · {comment.NguoiDung?.VaiTro || ''} · {new Date(comment.NgayTao).toLocaleString('vi-VN')}</span>
                                                {isEditingComment ? (
                                                    <div style={{ marginTop: 8 }}>
                                                        <Input.TextArea value={editingCommentContent} onChange={(event) => setEditingCommentContent(event.target.value)} rows={3} />
                                                        <Space style={{ marginTop: 8 }}>
                                                            <Button type="primary" size="small" onClick={() => handleUpdateComment(comment.Id)}>Lưu</Button>
                                                            <Button size="small" onClick={() => setEditingCommentId(null)}>Hủy</Button>
                                                        </Space>
                                                    </div>
                                                ) : <p style={{ margin: '8px 0 0' }}>{comment.NoiDung}</p>}
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>

                        <Modal
                            title="GỬI ĐỀ TÀI LÊN HỘI ĐỒNG ĐÁNH GIÁ"
                            open={submitModalOpen}
                            onCancel={() => {
                                setSubmitModalOpen(false);
                                setSubmitNotes('');
                                setAttachedFiles([]);
                            }}
                            footer={[
                                <Button
                                    key="cancel"
                                    danger
                                    onClick={() => {
                                        setSubmitModalOpen(false);
                                        setSubmitNotes('');
                                        setAttachedFiles([]);
                                    }}
                                >
                                    Đóng
                                </Button>,
                                <Button
                                    key="submit"
                                    type="primary"
                                    onClick={handleSubmitTopic}
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
                                        <p style={{ marginBottom: 12, fontWeight: 'bold' }}>Loại hội đồng</p>
                                        <Radio.Group
                                            value={councilType}
                                            onChange={(event) => setCouncilType(event.target.value as 'approval' | 'scoring')}
                                            optionType="button"
                                            buttonStyle="solid"
                                            options={[
                                                {
                                                    label: 'Hội đồng xét duyệt',
                                                    value: 'approval',
                                                    disabled: hasSubmittedForApproval,
                                                },
                                                {
                                                    label: 'Hội đồng chấm điểm',
                                                    value: 'scoring',
                                                    disabled: topic.TrangThai !== 'Đã phê duyệt' || hasSubmittedForScoring,
                                                },
                                            ]}
                                        />
                                        <p style={{ marginTop: 12, marginBottom: 0 }}>
                                            Hệ thống sẽ tự động gửi đến toàn bộ tài khoản thuộc hội đồng đã chọn.
                                        </p>
                                        {topic.TrangThai !== 'Đã phê duyệt' && (
                                            <p style={{ color: '#d46b08', marginTop: 8, marginBottom: 0 }}>
                                                Hội đồng chấm điểm chỉ nhận đề tài sau khi đề tài được phê duyệt.
                                            </p>
                                        )}
                                    </div>

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
                                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xlsx,.pptx"
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

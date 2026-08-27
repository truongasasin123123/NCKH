import React, { useState, useEffect } from 'react';
import type { CollapseProps } from 'antd';
import { Collapse, Spin, Button, Tag, Card, Row, Col, message, Form, Segmented } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftOutlined, EditOutlined, CloseOutlined, SendOutlined, BarChartOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { getTopicById, resendProjectApproval, submitProjectForApproval, updateProject } from '../services/topic/TopicService';
import { downloadDocument, uploadDocument, deleteDocument } from '../services/topic/DocumentsService';
import { createAdjustmentRequest } from '../services/topic/AdjustmentRequestService';
import {
    createCouncilAssignmentRequest,
    getAvailableCouncilTypes,
    getMyCouncilRequests,
    resubmitCouncilAssignmentRequest,
} from '../services/council/CouncilService';
import type { CouncilAssignmentRequest, CouncilBusiness, CouncilType } from '../services/council/CouncilService';
import TopicInformationPanel from '../components/topic-detail/TopicInformationPanel';
import CouncilPanel from '../components/topic-detail/CouncilPanel';
import TopicEditForm from '../components/topic-detail/TopicEditForm';
import CouncilCreateModal from '../components/topic-detail/CouncilCreatlModal';
import ApprovalSubmitModal from '../components/topic-detail/ApprovalSubmitModal';
import ResendApprovalModal from '../components/topic-detail/ResendApprovalModal';
import CommentsPanel from '../components/topic-detail/CommentsPanel';
import {
    useTopicApprovals,
    useTopicComments,
    useTopicDetails,
    useTopicDocuments,
} from '../hooks/topic-detail';
import type { ReviewerApproval } from '../components/topic-detail/types';
import AdjustmentRequestModal from '../components/progress-management/AdjustmentRequestModal';
import "../style/topic.css";

interface JwtPayload {
    TaiKhoan?: string;
    VaiTro?: string;
    role?: string;
}

const TopicDetail: React.FC = () => {
    const { MaDT } = useParams<{ MaDT: string }>(); // Sử dụng MaDT thay vì id
    const navigate = useNavigate();
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [councilTypes, setCouncilTypes] = useState<CouncilType[]>([]);
    const [councilRequests, setCouncilRequests] = useState<CouncilAssignmentRequest[]>([]);
    const [selectedCouncilTypeId, setSelectedCouncilTypeId] = useState<number>();
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [submitNotes, setSubmitNotes] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<UploadFile[]>([]);
    const [editing, setEditing] = useState(false);
    const PAGE_SIZE = 5; // số lượng hiển thị mỗi lần bấm "Tải thêm"
    const [docsVisibleCount, setDocsVisibleCount] = useState(PAGE_SIZE);
    const [commentsVisibleCount, setCommentsVisibleCount] = useState(PAGE_SIZE);
    const [activeView, setActiveView] = useState<'detail' | 'council'>('detail');
    const [resendModalOpen, setResendModalOpen] = useState(false);
    const [resendTarget, setResendTarget] = useState<ReviewerApproval | null>(null);
    const [resendNotes, setResendNotes] = useState('');
    const topicComments = useTopicComments(MaDT);
    const topicApprovals = useTopicApprovals(MaDT);
    const topicDetails = useTopicDetails();
    const topicDocuments = useTopicDocuments();
    const {
        topic,
        setTopic,
        members,
        acceptanceDossier,
        loading,
    } = topicDetails;

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

    const approvalReviewers = topicApprovals.approvalStatus.filter((reviewer) => reviewer.councilType === 'Xét duyệt');
    const approvedCount = approvalReviewers.filter((reviewer) => reviewer.status === 'Đã phê duyệt').length;
    const hasSubmittedForApproval = topicApprovals.submittedCouncilTypes.includes('Xét duyệt');
    const isRejected = topic?.TrangThai === 'Từ chối';
    const isTopicLeader = members.some((member) => {
        const memberRole = member.VaiTroDT
            ?.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/đ/g, 'd');
        return member.TaiKhoan === user?.TaiKhoan
            && (memberRole?.includes('truong nhom') || memberRole?.includes('nhom truong'));
    });
    const canEditProject = (topic?.TrangThai === 'Nháp' || isRejected) && isTopicLeader;
    const requestBusiness: CouncilBusiness | undefined = (() => {
        if (['Nháp', 'Chờ phân công hội đồng xét duyệt'].includes(topic?.TrangThai || '')) return 'approval';
        if (['Đã phê duyệt', 'Bắt đầu'].includes(topic?.TrangThai || '')) return 'monitoring';
        if (['Chờ nghiệm thu', 'Chờ phân công hội đồng nghiệm thu'].includes(topic?.TrangThai || '')) return 'scoring';
        return undefined;
    })();
    const requestTypes = councilTypes.filter((type) => type.NghiepVu === requestBusiness);
    const relatedRequests = councilRequests.filter((request) =>
        request.MaDT === MaDT && request.LoaiHoiDong?.NghiepVu === requestBusiness,
    );
    const latestCouncilRequest = councilRequests.find((request) => request.MaDT === MaDT);
    const pendingRequest = relatedRequests.find((request) => request.TrangThai === 'Chờ duyệt');
    const rejectedRequest = relatedRequests.find((request) => request.TrangThai === 'Từ chối');
    const acceptedRequest = relatedRequests.find((request) => request.TrangThai === 'Đã chấp nhận');
    const canRequestCouncil = isTopicLeader && !!requestBusiness && !pendingRequest && !acceptedRequest;
    const canSubmitApproval = isTopicLeader
        && ['Chờ phê duyệt', 'Chờ xét duyệt'].includes(topic?.TrangThai || '')
        && !hasSubmittedForApproval;
    const [form] = Form.useForm();
    const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
    const normalizedTopicStatus = (topic?.TrangThai || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .trim();
    const canCreateAdjustmentRequest = isTopicLeader
        // Dữ liệu cũ dùng "Đã phê duyệt" nhưng giao diện hiển thị là "Bắt đầu".
        && ['da phe duyet', 'bat dau', 'dang thuc hien'].includes(normalizedTopicStatus);
    useEffect(() => {
        fetchTopicDetail();
    }, [MaDT]);

    const handleDeleteDocument = async (documentId: number) => {
        if (!MaDT) return;
        try {
            await deleteDocument(documentId);
            message.success('Đã xóa tài liệu');
            await topicDocuments.refresh(MaDT);
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa tài liệu');
        }
    };

    useEffect(() => {
        const loadCouncilRequestData = async () => {
            const [typesResult, requestsResult] = await Promise.allSettled([
                getAvailableCouncilTypes(),
                getMyCouncilRequests(),
            ]);

            if (typesResult.status === 'fulfilled') {
                setCouncilTypes(typesResult.value);
            } else {
                console.warn('Không tải được danh mục loại hội đồng:', typesResult.reason);
            }

            if (requestsResult.status === 'fulfilled') {
                setCouncilRequests(requestsResult.value);
            } else {
                // Đề tài cũ không có yêu cầu phân công vẫn phải mở và dùng được luồng cũ.
                console.warn('Không tải được lịch sử yêu cầu hội đồng:', requestsResult.reason);
                setCouncilRequests([]);
            }
        };

        void loadCouncilRequestData();
    }, []);

    useEffect(() => {
        if (!MaDT) return;

        const refreshInterval = window.setInterval(async () => {
            try {
                const [latestTopic] = await Promise.all([
                    getTopicById(MaDT),
                    topicApprovals.refresh(),
                    topicComments.refresh(),
                    topicDetails.refreshAcceptanceDossier(MaDT),
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
            const data = await topicDetails.load(MaDT);
            if (data) {
                await topicApprovals.refresh();
                await topicComments.refresh();
                await topicDocuments.refresh(MaDT);
                form.setFieldsValue({
                    TenDT: data.TenDT,
                    PhanLoai: data.PhanLoai,
                    NgayBatDau: data.NgayBatDau ? new Date(data.NgayBatDau).toISOString().split('T')[0] : '',
                    NgayKetThuc: data.NgayKetThuc ? new Date(data.NgayKetThuc).toISOString().split('T')[0] : '',
                    MoTa: data.MoTa,
                });
            } else {
                message.error('Không tìm thấy đề tài');
                navigate('/mainhome');
            }
        } catch (error) {
            message.error('Lỗi khi tải chi tiết đề tài');
            console.error(error);
        }
    };

    const collapseItems: CollapseProps['items'] = [
        {
            key: 'hoidong-nghiem-thu',
            label: 'Hội đồng nghiệm thu',
            extra: acceptanceDossier?.DiemTrungBinh !== undefined ? (
                <Tag color="green" style={{ marginRight: 8 }}>
                    Điểm: {Number(acceptanceDossier.DiemTrungBinh).toFixed(2)}
                </Tag>
            ) : <span style={{ color: '#8c8c8c', marginRight: 8 }}>Chưa có điểm trung bình</span>,
            children: acceptanceDossier?.PhieuCham?.length ? (
                <Collapse items={acceptanceDossier.PhieuCham.map((score) => ({
                    key: score.Id,
                    label: `${score.NguoiHoiDong?.TenDayDu || score.TaiKhoanHoiDong} · ${score.TrangThai}`,
                    children: <div><p><strong>Nhận xét:</strong> {score.NhanXet || 'Chưa công bố'}</p></div>,
                }))} />
            ) : <p>Hồ sơ chưa được gửi đến hội đồng nghiệm thu.</p>,
        },
    ];

    const handleSubmitTopic = async () => {
        const councilType = 'approval';
        const isResubmission = topic?.TrangThai === 'Từ chối';
        if (hasSubmittedForApproval && !isResubmission) {
            message.warning('Đề tài đã được gửi Hội đồng xét duyệt, không thể gửi lại');
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
            setTopic((prev) => prev ? { ...prev, TrangThai: 'Chờ phê duyệt' } : prev);
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
                councilType: reviewer.LoaiHoiDong || 'Xét duyệt',
            }));
            topicApprovals.setApprovalStatus((current) => [
                ...current.filter((reviewer) => reviewer.councilType !== 'Xét duyệt'),
                ...newReviewers,
            ]);
            topicApprovals.setSubmittedCouncilTypes((current) => Array.from(new Set([
                ...current,
                'Xét duyệt',
            ])) as Array<'Xét duyệt' | 'Chấm điểm'>);
            await topicDocuments.refresh(MaDT);

            message.success(
                isResubmission
                    ? 'Đã gửi lại phiếu xét duyệt cho các thành viên đã từ chối'
                    : `Đã gửi đề tài đến ${newReviewers.length} thành viên Hội đồng xét duyệt`,
            );
            setApprovalModalOpen(false);
            setSubmitNotes('');
            setAttachedFiles([]);
        } catch (error: any) {
            message.error(error?.response?.data?.message || error.message || 'Không thể upload tài liệu');
        }
    };

    const handleSubmitCouncilRequest = async () => {
        if (!MaDT || !selectedCouncilTypeId) {
            message.warning('Vui lòng chọn loại hội đồng');
            return;
        }

        try {
            await Promise.all(attachedFiles.map((uploadFile) => {
                if (!uploadFile.originFileObj) throw new Error(`Không đọc được file ${uploadFile.name}`);
                return uploadDocument({
                    file: uploadFile.originFileObj,
                    maDT: MaDT,
                    loaiTaiLieu: 'Tài liệu gửi đánh giá',
                });
            }));

            const payload = {
                MaLoaiHoiDong: selectedCouncilTypeId,
                LyDoYeuCau: submitNotes,
            };
            if (rejectedRequest) {
                await resubmitCouncilAssignmentRequest(rejectedRequest.Id, payload);
            } else {
                await createCouncilAssignmentRequest(MaDT, payload);
            }

            message.success(rejectedRequest ? 'Đã gửi lại yêu cầu phân công hội đồng' : 'Đã gửi yêu cầu phân công hội đồng');
            setSubmitModalOpen(false);
            setSubmitNotes('');
            setAttachedFiles([]);
            setSelectedCouncilTypeId(undefined);
            const [requests] = await Promise.all([getMyCouncilRequests(), fetchTopicDetail()]);
            setCouncilRequests(requests);
        } catch (error: any) {
            message.error(error?.response?.data?.message || error.message || 'Không thể gửi yêu cầu phân công hội đồng');
        }
    };

    const handleResendToReviewer = async () => {
        if (!MaDT || !resendTarget) return;
        try {
            await resendProjectApproval(MaDT, resendTarget.account, resendNotes);

            message.success(`Đã gửi lại cho ${resendTarget.name}`);
            setResendModalOpen(false);
            setResendNotes('');
            setResendTarget(null);
            await topicApprovals.refresh();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể gửi lại');
        }
    };


    const getStatusTag = (status: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
            "Nháp": { color: 'default', label: 'Nháp' },
            "Đã phê duyệt": { color: 'green', label: 'Bắt đầu' },
            "Bắt đầu": { color: 'green', label: 'Bắt đầu' },
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
            "Chờ xét duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
            "Chờ phân công hội đồng xét duyệt": { color: 'gold', label: 'Chờ phân công hội đồng xét duyệt' },
            "Chờ phân công hội đồng nghiệm thu": { color: 'gold', label: 'Chờ phân công hội đồng nghiệm thu' },
            "Chờ phân công hội đồng theo dõi": { color: 'gold', label: 'Chờ phân công đội ngũ theo dõi' },
            "Từ chối": { color: 'red', label: 'Từ chối' },
            "Chờ nghiệm thu": { color: 'gold', label: 'Chờ nghiệm thu' },
            "Đang nghiệm thu": { color: 'processing', label: 'Đang nghiệm thu' },
            "Đã nghiệm thu": { color: 'green', label: 'Đã nghiệm thu' },
            "Không đạt nghiệm thu": { color: 'red', label: 'Không đạt nghiệm thu' },
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
                        {!editing && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, fontWeight: 600 }}>
                                <Segmented
                                    className="custom-segmented"
                                    value={activeView}
                                    onChange={(value) => setActiveView(value as 'detail' | 'council')}
                                    options={[
                                        { label: 'Đề tài', value: 'detail' },
                                        { label: 'Hội đồng', value: 'council' },
                                    ]}
                                    block
                                />
                            </div>
                        )}
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
                                            {canRequestCouncil && (
                                                <Button
                                                    type="dashed"
                                                    icon={<SendOutlined />}
                                                    block
                                                    onClick={() => {
                                                        setSelectedCouncilTypeId(rejectedRequest?.MaLoaiHoiDong || requestTypes[0]?.MaLoaiHoiDong);
                                                        setSubmitModalOpen(true);
                                                    }}
                                                >
                                                    {rejectedRequest ? 'Gửi lại yêu cầu hội đồng' : 'Yêu cầu phân công hội đồng'}
                                                </Button>
                                            )}
                                            {pendingRequest && (
                                                <Tag color="blue" style={{ display: 'block', textAlign: 'center' }}>
                                                    Đang chờ Admin phân công hội đồng
                                                </Tag>
                                            )}
                                            {canSubmitApproval && (
                                                <Button type="primary" icon={<SendOutlined />} block onClick={() => setApprovalModalOpen(true)}>
                                                    Gửi hồ sơ xét duyệt
                                                </Button>
                                            )}
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
                                            {canCreateAdjustmentRequest && (
                                                <Button
                                                    block
                                                    style={{
                                                        color: '#d46b08',
                                                        borderColor: '#faad14',
                                                        background: '#fffbe6',
                                                    }}
                                                    onClick={() => {
                                                        setAdjustmentModalOpen(true);
                                                    }}
                                                >
                                                    Tạo phiếu điều chỉnh
                                                </Button>
                                            )}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </Card>

                        {latestCouncilRequest && (
                            <Card size="small" title="Yêu cầu phân công hội đồng" style={{ marginBottom: 16 }}>
                                <p style={{ marginBottom: 8 }}>
                                    <strong>Loại hội đồng:</strong> {latestCouncilRequest.LoaiHoiDong?.TenLoaiHoiDong || `Loại #${latestCouncilRequest.MaLoaiHoiDong}`}
                                </p>
                                <p style={{ marginBottom: 8 }}>
                                    <strong>Trạng thái:</strong>{' '}
                                    <Tag color={latestCouncilRequest.TrangThai === 'Đã chấp nhận' ? 'green' : latestCouncilRequest.TrangThai === 'Từ chối' ? 'red' : 'blue'}>
                                        {latestCouncilRequest.TrangThai}
                                    </Tag>
                                </p>
                                {latestCouncilRequest.HoiDong && <p style={{ marginBottom: 8 }}><strong>Hội đồng được phân công:</strong> {latestCouncilRequest.HoiDong.TenHoiDong}</p>}
                                {latestCouncilRequest.LyDoTuChoi && <p style={{ marginBottom: 0, color: '#cf1322' }}><strong>Lý do từ chối:</strong> {latestCouncilRequest.LyDoTuChoi}</p>}
                            </Card>
                        )}



                        {editing ? (
                            <TopicEditForm form={form} onSubmit={handleEditSubmit} onCancel={handleCancelEdit} />
                        ) : activeView === 'detail' ? (
                            <TopicInformationPanel
                                topic={topic}
                                members={members}
                                documents={topicDocuments.documents}
                                documentsLoading={topicDocuments.loading}
                                visibleDocumentCount={docsVisibleCount}
                                isTopicLeader={isTopicLeader}
                                onShowMoreDocuments={() => setDocsVisibleCount((current) =>
                                    current >= topicDocuments.documents.length
                                        ? PAGE_SIZE
                                        : topicDocuments.documents.length,
                                )}
                                onDownloadDocument={downloadDocument}
                                onDeleteDocument={handleDeleteDocument}
                                onFilterDocuments={(query) => {
                                    if (MaDT) {
                                        setDocsVisibleCount(PAGE_SIZE);
                                        void topicDocuments.refresh(MaDT, query);
                                    }
                                }}
                            />
                        ) : (
                            <CouncilPanel
                                reviewers={topicApprovals.approvalStatus}
                                history={topicApprovals.approvalHistory}
                                approvedCount={approvedCount}
                                totalReviewers={approvalReviewers.length}
                                isTopicLeader={isTopicLeader}
                                canOpenAcceptance={['Chờ nghiệm thu', 'Đang nghiệm thu', 'Đã nghiệm thu', 'Không đạt nghiệm thu'].includes(topic.TrangThai)}
                                acceptanceItems={collapseItems}
                                onResend={(reviewer) => {
                                    setResendTarget(reviewer);
                                    setResendModalOpen(true);
                                }}
                                onOpenAcceptance={() => navigate(`/mainhome/acceptance/${MaDT}`)}
                                renderStatus={getApprovalStatusTag}
                                // --- thêm mới ---
                                documents={topicDocuments.documents}
                                documentsLoading={topicDocuments.loading}
                                visibleDocumentCount={docsVisibleCount}
                                onShowMoreDocuments={() => setDocsVisibleCount((current) =>
                                    current >= topicDocuments.documents.length
                                        ? PAGE_SIZE
                                        : topicDocuments.documents.length,
                                )}
                                onDownloadDocument={downloadDocument}
                                onFilterDocuments={(query) => {
                                    if (MaDT) {
                                        setDocsVisibleCount(PAGE_SIZE);
                                        void topicDocuments.refresh(MaDT, query);
                                    }
                                }}
                            />
                        )}
                        <CommentsPanel
                            comments={topicComments.comments}
                            visibleCount={commentsVisibleCount}
                            currentAccount={user?.TaiKhoan}
                            canComment={canComment}
                            value={topicComments.input}
                            editingId={topicComments.editingId}
                            editingValue={topicComments.editingContent}
                            onValueChange={topicComments.setInput}
                            onCreate={topicComments.create}
                            onStartEdit={(comment) => {
                                topicComments.setEditingId(comment.Id);
                                topicComments.setEditingContent(comment.NoiDung);
                            }}
                            onEditingValueChange={topicComments.setEditingContent}
                            onSaveEdit={topicComments.update}
                            onCancelEdit={() => topicComments.setEditingId(null)}
                            onDelete={topicComments.remove}
                            onShowMore={() => setCommentsVisibleCount((count) => count + PAGE_SIZE)}
                        />
                        <CouncilCreateModal
                            topic={topic}
                            open={submitModalOpen}
                            isResubmission={!!rejectedRequest}
                            councilTypes={councilTypes}
                            allowedBusiness={requestBusiness}
                            councilTypeId={selectedCouncilTypeId}
                            note={submitNotes}
                            files={attachedFiles}
                            onCouncilTypeChange={setSelectedCouncilTypeId}
                            onNoteChange={setSubmitNotes}
                            onFilesChange={setAttachedFiles}
                            onClose={() => {
                                setSubmitModalOpen(false);
                                setSelectedCouncilTypeId(undefined);
                                setSubmitNotes('');
                                setAttachedFiles([]);
                            }}
                            onSubmit={handleSubmitCouncilRequest}
                        />
                        <ApprovalSubmitModal
                            topic={topic}
                            open={approvalModalOpen}
                            isResubmission={isRejected}
                            note={submitNotes}
                            files={attachedFiles}
                            onNoteChange={setSubmitNotes}
                            onFilesChange={setAttachedFiles}
                            onClose={() => {
                                setApprovalModalOpen(false);
                                setSubmitNotes('');
                                setAttachedFiles([]);
                            }}
                            onSubmit={handleSubmitTopic}
                        />
                        <ResendApprovalModal
                            open={resendModalOpen}
                            target={resendTarget}
                            note={resendNotes}
                            onChangeNote={setResendNotes}
                            onClose={() => {
                                setResendModalOpen(false);
                                setResendNotes('');
                                setResendTarget(null);
                            }}
                            onSubmit={handleResendToReviewer}
                        />
                        {adjustmentModalOpen && (
                            <AdjustmentRequestModal
                                open={adjustmentModalOpen}
                                topicCode={MaDT || ''}
                                topic={topic}
                                members={members}
                                onClose={() => {
                                    setAdjustmentModalOpen(false);
                                }}
                                onSubmit={async (topicCode, payload) => {
                                    const request = await createAdjustmentRequest(topicCode, {
                                        nhomDieuChinh: payload.nhomDieuChinh,
                                        thongTinHienTai: payload.thongTinHienTai,
                                        noiDungDeNghi: payload.noiDungDeNghi,
                                        lyDo: payload.lyDo,
                                    });

                                    const uploadFiles = payload.files.reduce<File[]>(
                                        (files, item) => {
                                            if (item.originFileObj) {
                                                files.push(item.originFileObj);
                                            }
                                            return files;
                                        },
                                        [],
                                    );

                                    await Promise.all(
                                        uploadFiles.map((file) => uploadDocument({
                                            file,
                                            maDT: topicCode,
                                            maYeuCauDieuChinh: request.Id,
                                            loaiTaiLieu: 'Tài liệu phiếu điều chỉnh',
                                        })),
                                    );
                                }}
                            />
                        )}
                    </>
                )}
            </Spin>
        </div>
    );
};

export default TopicDetail;

import React, { useState, useEffect } from 'react';
import type { CollapseProps } from 'antd';
import { Collapse, Spin, Button, Tag, Card, Row, Col, message, Form, Segmented } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ArrowLeftOutlined, EditOutlined, CloseOutlined, SendOutlined, BarChartOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { getTopicById, resendProjectApproval, submitProjectForApproval, updateProject } from '../services/topic/TopicService';
import { downloadDocument, uploadDocument } from '../services/topic/DocumentsService';
import TopicInformationPanel from '../components/topic-detail/TopicInformationPanel';
import CouncilPanel from '../components/topic-detail/CouncilPanel';
import TopicEditForm from '../components/topic-detail/TopicEditForm';
import CouncilCreateModal from '../components/topic-detail/CouncilCreatlModal';
import ResendApprovalModal from '../components/topic-detail/ResendApprovalModal';
import CommentsPanel from '../components/topic-detail/CommentsPanel';
import {
    useTopicApprovals,
    useTopicComments,
    useTopicDetails,
    useTopicDocuments,
} from '../hooks/topic-detail';
import type { ReviewerApproval } from '../components/topic-detail/types';
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
    const [submitCouncilType, setSubmitCouncilType] = useState<'approval' | 'scoring'>('approval');
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
    const isTopicLeader = members.some((member) =>
        member.TaiKhoan === user?.TaiKhoan && member.VaiTroDT === 'Nhóm trưởng',
    );
    const canEditProject = (topic?.TrangThai === 'Nháp' || isRejected) && isTopicLeader;
    const canSendToCouncil = isTopicLeader && !hasSubmittedForApproval;
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
                    topicApprovals.refresh(),
                    topicComments.refresh(),
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
        const councilType = submitCouncilType;
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
            setSubmitModalOpen(false);
            setSubmitCouncilType('approval');
            setSubmitNotes('');
            setAttachedFiles([]);
        } catch (error: any) {
            message.error(error?.response?.data?.message || error.message || 'Không thể upload tài liệu');
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
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
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
                                            <Button
                                                type="dashed"
                                                icon={<SendOutlined />}
                                                block
                                                disabled={!canSendToCouncil}
                                                onClick={() => setSubmitModalOpen(true)}
                                            >
                                                {canSendToCouncil ? 'Gửi yêu cầu tạo hội đồng' : 'Đã gửi yêu cầu'}
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
                            <TopicEditForm form={form} onSubmit={handleEditSubmit} onCancel={handleCancelEdit} />
                        ) : activeView === 'detail' ? (
                            <TopicInformationPanel
                                topic={topic}
                                members={members}
                                documents={topicDocuments.documents}
                                documentsLoading={topicDocuments.loading}
                                visibleDocumentCount={docsVisibleCount}
                                onShowMoreDocuments={() => setDocsVisibleCount((current) => current + PAGE_SIZE)}
                                onDownloadDocument={downloadDocument}
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
                            isResubmission={isRejected}
                            councilType={submitCouncilType}
                            note={submitNotes}
                            files={attachedFiles}
                            onCouncilTypeChange={setSubmitCouncilType}
                            onNoteChange={setSubmitNotes}
                            onFilesChange={setAttachedFiles}
                            onClose={() => {
                                setSubmitModalOpen(false);
                                setSubmitCouncilType('approval');
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
                    </>
                )}
            </Spin>
        </div>
    );
};

export default TopicDetail;

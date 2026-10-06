import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
    Spin, Button, Tag, Card, Row, Col, List, Collapse,
    message, Modal, Input, Divider, Form, Space, Popconfirm
} from 'antd';
import {
    ArrowLeftOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import {
    getTopicById,
    getMemberByTopic,
    getProjectApprovals,
    reviewProject,
} from '../services/topic/TopicService';
import type { TopicLoad, ThanhVienDT } from '../services/topic/TopicService';
import { downloadDocument, getDocumentsByTopic } from '../services/topic/DocumentsService';
import type { DocumentQueryParams } from '../services/topic/DocumentsService';
import { createProjectComment, deleteProjectComment, getProjectComments, updateProjectComment } from '../services/topic/CommentsService';
import type { ProjectComment } from '../services/topic/CommentsService';
import { getAcceptanceByProject } from '../services/topic/AcceptanceService';
import type { HoSoNghiemThu } from '../services/topic/AcceptanceService';
import TopicInformationPanel from '../components/topic-detail/TopicInformationPanel';
import ApprovalReviewActions from '../components/topic-detail/ApprovalReviewActions';
import type { ProjectDocumentItem } from '../components/topic-detail/types';

interface JwtPayload {
    TaiKhoan?: string;
}

const TopicDetailCommittee: React.FC = () => {
    const { MaDT } = useParams<{ MaDT: string }>();
    const navigate = useNavigate();
    const [topic, setTopic] = useState<TopicLoad | null>(null);
    const [members, setMembers] = useState<ThanhVienDT[]>([]);
    const [loading, setLoading] = useState(true);
    const [myApprovalStatus, setMyApprovalStatus] = useState<string | null>(null);
    const [myApprovalType, setMyApprovalType] = useState<string>('Xét duyệt');
    const isLiquidationReview = myApprovalType === 'Thanh lý';

    // State cho modal phê duyệt
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveNote, setApproveNote] = useState('');

    // State cho modal từ chối
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [commentText, setCommentText] = useState('');
    const [projectComments, setProjectComments] = useState<ProjectComment[]>([]);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [projectDocuments, setProjectDocuments] = useState<ProjectDocumentItem[]>([]);
    const DOCUMENT_PAGE_SIZE = 5;
    const [visibleDocumentCount, setVisibleDocumentCount] = useState(DOCUMENT_PAGE_SIZE);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [acceptanceDossier, setAcceptanceDossier] = useState<HoSoNghiemThu | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) {
            message.warning('Vui lòng nhập nhận xét');
            return;
        }
        if (!MaDT) return;
        try {
            const comment = await createProjectComment(MaDT, commentText);
            setProjectComments((current) => [comment, ...current]);
            setCommentText('');
            message.success('Đã thêm nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể thêm nhận xét');
        }
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
            const memData = await getMemberByTopic(MaDT);
            const approvals = await getProjectApprovals(MaDT);
            if (data) {
                setTopic(data);
                setMembers(memData);
                const myApproval = approvals.find((approval: {
                    TaiKhoanHoiDong: string;
                    LoaiHoiDong?: string;
                    TrangThai: string;
                }) => approval.TaiKhoanHoiDong === user?.TaiKhoan
                    && ['Xét duyệt', 'Thanh lý'].includes(approval.LoaiHoiDong || 'Xét duyệt'));
                setMyApprovalStatus(myApproval?.TrangThai || null);
                setMyApprovalType(myApproval?.LoaiHoiDong || 'Xét duyệt');
                await fetchProjectDocuments(MaDT);
                await fetchComments(MaDT);
                try {
                    const dossiers = await getAcceptanceByProject(MaDT);
                    setAcceptanceDossier(dossiers[0] || null);
                } catch (acceptanceError) {
                    console.warn('Chưa tải được hồ sơ nghiệm thu:', acceptanceError);
                    setAcceptanceDossier(null);
                }
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

    const fetchProjectDocuments = async (maDT: string, query?: DocumentQueryParams) => {
        try {
            setDocumentsLoading(true);
            const documents = await getDocumentsByTopic(maDT, query);
            setProjectDocuments(documents.map((document) => ({
                id: document.MaTL,
                name: document.TenFile,
                source: document.LoaiTaiLieu || 'Tài liệu đề tài',
                date: document.NgayTaiLen ? new Date(document.NgayTaiLen).toLocaleDateString('vi-VN') : undefined,
            })));
            setVisibleDocumentCount(DOCUMENT_PAGE_SIZE);
        } catch (error) {
            console.error('Lỗi khi tải tài liệu đề tài:', error);
            message.error('Không thể tải tài liệu đề tài');
        } finally {
            setDocumentsLoading(false);
        }
    };

    const fetchComments = async (maDT: string) => {
        try {
            setProjectComments(await getProjectComments(maDT));
        } catch (error) {
            console.error('Lỗi khi tải nhận xét:', error);
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
            "Bắt đầu": { color: 'green', label: 'Bắt đầu' },
            "Đang thực hiện": { color: 'blue', label: 'Đang thực hiện' },
            "Sắp hạn": { color: 'orange', label: 'Sắp hạn' },
            "Khẩn cấp": { color: 'red', label: 'Khẩn cấp' },
            "Chờ phê duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
            "Chờ xét duyệt": { color: 'blue', label: 'Chờ phê duyệt' },
            "Chờ phân công hội đồng xét duyệt": { color: 'gold', label: 'Chờ phân công hội đồng xét duyệt' },
            "Chờ phân công hội đồng theo dõi": { color: 'gold', label: 'Chờ phân công đội ngũ theo dõi' },
            "Chờ phân công hội đồng nghiệm thu": { color: 'gold', label: 'Chờ phân công hội đồng nghiệm thu' },
            "Chờ phân công hội đồng thanh lý": { color: 'volcano', label: 'Chờ phân công hội đồng thanh lý' },
            "Chờ thanh lý": { color: 'orange', label: 'Chờ thanh lý' },
            "Đã thanh lý": { color: 'default', label: 'Đã thanh lý' },
            "Từ chối": { color: 'red', label: 'Từ chối' },
            "Chờ nghiệm thu": { color: 'gold', label: 'Chờ nghiệm thu' },
            "Đang nghiệm thu": { color: 'processing', label: 'Đang nghiệm thu' },
            "Đã nghiệm thu": { color: 'green', label: 'Đã nghiệm thu' },
            "Không đạt nghiệm thu": { color: 'red', label: 'Không đạt nghiệm thu' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: status || 'Không xác định' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    // Xử lý phê duyệt
    const handleApprove = async () => {
        if (!approveNote.trim()) {
            message.warning(isLiquidationReview ? 'Vui lòng nhập nhận xét / ý kiến thanh lý' : 'Vui lòng nhập nhận xét trước khi phê duyệt');
            return;
        }

        if (!topic) return;

        try {
            setLoading(true);
            const result = await reviewProject(topic.MaDT, 'approved', approveNote);
            setTopic({ ...topic, TrangThai: result.projectStatus });
            setMyApprovalStatus('Đã phê duyệt');
            if (isLiquidationReview) {
                message.success(
                    result.allApproved
                        ? 'Tất cả thành viên hội đồng đã đồng ý. Đề tài đã được thanh lý.'
                        : `Đã ghi nhận ý kiến đồng ý thanh lý (${result.approvedReviewers}/${result.totalReviewers}).`,
                );
            } else {
                message.success(
                    result.allApproved
                        ? 'Tất cả hội đồng đã phê duyệt. Đề tài được bắt đầu.'
                        : `Đã ghi nhận phê duyệt (${result.approvedReviewers}/${result.totalReviewers}).`,
                );
            }
            setApproveModalOpen(false);
            setApproveNote('');

            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (error) {
            console.error(error);
            message.error(isLiquidationReview ? 'Lỗi khi đồng ý thanh lý đề tài' : 'Lỗi khi phê duyệt đề tài');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            message.warning(isLiquidationReview ? 'Vui lòng nhập lý do không đồng ý thanh lý' : 'Vui lòng nhập lý do từ chối');
            return;
        }

        if (!topic) {
            message.error('Không có đề tài để xử lý');
            return;
        }

        try {
            setLoading(true);
            const result = await reviewProject(topic.MaDT, 'rejected', rejectReason);
            setTopic({ ...topic, TrangThai: result.projectStatus });
            setMyApprovalStatus('Từ chối');
            if (isLiquidationReview) {
                message.info('Đã từ chối thanh lý đề tài. Đề tài quay về trạng thái trước đó để sinh viên tiếp tục thực hiện.');
            } else {
                message.error('Đã từ chối đề tài');
            }
            setRejectModalOpen(false);
            setRejectReason('');
        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
            <Spin spinning={loading}>
                {topic && (
                    <>
                        {/* Nút quay lại */}
                        <div>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/mainhome/approvedtopics')}
                                style={{ marginBottom: 16 }}
                            >
                                Quay lại
                            </Button>
                            <Button
                                icon={<BarChartOutlined />}
                                onClick={() => navigate(`/mainhome/progress/${MaDT}`)}
                            >
                                Quản lý tiến độ
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
                                    <ApprovalReviewActions
                                        canReview={myApprovalStatus === 'Chờ phê duyệt'}
                                        approveText={isLiquidationReview ? 'Đồng ý thanh lý' : 'Phê duyệt đề tài'}
                                        rejectText={isLiquidationReview ? 'Không đồng ý thanh lý' : 'Từ chối phê duyệt'}
                                        onApprove={() => setApproveModalOpen(true)}
                                        onReject={() => setRejectModalOpen(true)}
                                    />
                                </Col>
                            </Row>
                        </Card>


                        <TopicInformationPanel
                            topic={topic}
                            members={members}
                            documents={projectDocuments}
                            documentsLoading={documentsLoading}
                            visibleDocumentCount={visibleDocumentCount}
                            onShowMoreDocuments={() => setVisibleDocumentCount((current) =>
                                current >= projectDocuments.length
                                    ? DOCUMENT_PAGE_SIZE
                                    : projectDocuments.length,
                            )}
                            onDownloadDocument={downloadDocument}
                            onFilterDocuments={(query) => {
                                if (MaDT) {
                                    void fetchProjectDocuments(MaDT, query);
                                }
                            }}
                            isTopicLeader={false}
                            onDeleteDocument={() => { }}
                        />

                        {acceptanceDossier && (
                            <Card title="Tổng hợp điểm nghiệm thu" style={{ marginTop: 16 }}>
                                <Collapse
                                    items={[{
                                        key: 'acceptance-council',
                                        label: 'Hội đồng nghiệm thu',
                                        extra: acceptanceDossier.DiemTrungBinh !== undefined
                                            ? <Tag color="blue">Điểm trung bình: {Number(acceptanceDossier.DiemTrungBinh).toFixed(2)}</Tag>
                                            : <span style={{ color: '#8c8c8c' }}>Chưa có điểm trung bình</span>,
                                        children: <>
                                            <p><strong>Điểm cuối cùng:</strong> {acceptanceDossier.DiemCuoiCung ?? 'Chưa chốt'}</p>
                                            <p><strong>Kết quả:</strong> {acceptanceDossier.KetQuaCuoiCung || 'Đang chấm'}</p>
                                            <Collapse
                                                items={(acceptanceDossier.PhieuCham || []).map((score) => ({
                                                    key: score.Id,
                                                    label: `${score.NguoiHoiDong?.TenDayDu || score.TaiKhoanHoiDong} · ${score.Diem ?? 'Chưa chấm'} điểm`,
                                                    children: <p>{score.NhanXet || 'Chưa có nhận xét'}</p>,
                                                }))}
                                            />
                                            {!acceptanceDossier.PhieuCham?.length && <p>Chưa có phiếu chấm.</p>}
                                        </>,
                                    }]}
                                />
                            </Card>
                        )}


                        <div ref={scrollRef}>
                            <Card
                                title="Thời gian"
                                style={{ marginTop: 16 }}
                            >
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} md={8}>
                                        <p>
                                            <strong>Ngày bắt đầu:</strong>{' '}
                                            {topic.NgayBatDau ? new Date(topic.NgayBatDau).toLocaleDateString('vi-VN') : '-'}
                                        </p>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <p>
                                            <strong>Ngày kết thúc:</strong>{' '}
                                            {topic.NgayKetThuc ? new Date(topic.NgayKetThuc).toLocaleDateString('vi-VN') : '-'}
                                        </p>
                                    </Col>
                                </Row>
                            </Card>
                        </div>

                        <Card title="Nhận xét" style={{ marginTop: 16 }}>
                            <Form layout="vertical" onFinish={handleCommentSubmit}>
                                <Form.Item label="Ý kiến của hội đồng">
                                    <Input.TextArea rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Nhập nhận xét về đề tài..." />
                                </Form.Item>
                                <Form.Item><Button type="primary" htmlType="submit">Thêm nhận xét</Button></Form.Item>
                            </Form>
                            <List
                                locale={{ emptyText: 'Chưa có nhận xét' }}
                                dataSource={projectComments}
                                renderItem={(comment) => {
                                    const isAuthor = comment.TaiKhoan === user?.TaiKhoan;
                                    const isEditingComment = editingCommentId === comment.Id;
                                    return (
                                        <List.Item actions={isAuthor ? [
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
                                        ] : undefined}>
                                            <div style={{ width: '100%' }}>
                                                <strong>{comment.NguoiDung?.TenDayDu || comment.TaiKhoan}</strong>
                                                {comment.HoiDongs?.length ? <span style={{ color: '#1677ff' }}> · {comment.HoiDongs.join(', ')}</span> : <span style={{ color: '#8c8c8c' }}> · {comment.NguoiDung?.VaiTro || ''}</span>}
                                                {isEditingComment ? (
                                                    <div style={{ marginTop: 8 }}>
                                                        <Input.TextArea rows={3} value={editingCommentContent} onChange={(event) => setEditingCommentContent(event.target.value)} />
                                                        <Space style={{ marginTop: 8 }}><Button type="primary" size="small" onClick={() => handleUpdateComment(comment.Id)}>Lưu</Button><Button size="small" onClick={() => setEditingCommentId(null)}>Hủy</Button></Space>
                                                    </div>
                                                ) : <p style={{ margin: '8px 0 0' }}>{comment.NoiDung}</p>}
                                                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 6 }}>{new Date(comment.NgayTao).toLocaleString('vi-VN')}</div>
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>

                        {/* Modal Phê duyệt */}
                        <Modal
                            title={isLiquidationReview ? "Xác nhận đồng ý thanh lý đề tài" : "Xác nhận phê duyệt đề tài"}
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
                                    {isLiquidationReview ? 'Đồng ý thanh lý' : 'Xác nhận phê duyệt'}
                                </Button>,
                            ]}
                        >
                            {isLiquidationReview ? (
                                <p>Bạn có chắc chắn muốn <strong>đồng ý thanh lý</strong> đề tài <strong>{topic.TenDT}</strong> không? Đề tài sẽ kết thúc nghiên cứu và chuyển sang trạng thái <strong>Đã thanh lý</strong>.</p>
                            ) : (
                                <p>Bạn có chắc chắn muốn <strong>phê duyệt</strong> đề tài <strong>{topic.TenDT}</strong> không?</p>
                            )}
                            <Divider />
                            <p style={{ marginBottom: 8 }}>
                                {isLiquidationReview ? 'Ý kiến / Nhận xét thanh lý' : 'Nhận xét khi phê duyệt'} <span style={{ color: 'red' }}>*</span>:
                            </p>
                            <Input.TextArea
                                rows={4}
                                placeholder={isLiquidationReview ? "Nhập nhận xét đánh giá lý do thanh lý đề tài..." : "Nhập nhận xét đánh giá đề tài trước khi phê duyệt..."}
                                value={approveNote}
                                onChange={(e) => setApproveNote(e.target.value)}
                            />
                            {!approveNote.trim() && (
                                <p style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                                    {isLiquidationReview ? 'Vui lòng nhập nhận xét / ý kiến thanh lý' : 'Vui lòng nhập nhận xét trước khi phê duyệt'}
                                </p>
                            )}
                        </Modal>

                        {/* Modal Từ chối */}
                        <Modal
                            title={isLiquidationReview ? "Từ chối yêu cầu thanh lý đề tài" : "Từ chối phê duyệt đề tài"}
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
                                    {isLiquidationReview ? 'Không đồng ý thanh lý' : 'Xác nhận từ chối'}
                                </Button>,
                            ]}
                        >
                            {isLiquidationReview ? (
                                <p>Bạn sắp <strong>từ chối yêu cầu thanh lý</strong> đề tài <strong>{topic.TenDT}</strong>. Đề tài sẽ quay về trạng thái trước đó để sinh viên tiếp tục thực hiện.</p>
                            ) : (
                                <p>Bạn sắp <strong>từ chối</strong> đề tài <strong>{topic.TenDT}</strong>.</p>
                            )}
                            <Divider />
                            <p style={{ marginBottom: 8 }}>
                                {isLiquidationReview ? 'Lý do không đồng ý thanh lý' : 'Lý do từ chối'} <span style={{ color: 'red' }}>*</span>:
                            </p>
                            <Input.TextArea
                                rows={4}
                                placeholder={isLiquidationReview ? "Nhập lý do không đồng ý thanh lý (bắt buộc)..." : "Nhập lý do từ chối (bắt buộc)..."}
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

import React, { useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Table, Tag, Space, Button, message, Spin, Popconfirm, Input, Popover, Select } from 'antd';
import { EyeOutlined, DeleteOutlined, FileTextOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { deleteProject, getMyTopics, getPendingTopics } from '../services/topic/TopicService';
import type { TopicLoad } from '../services/topic/TopicService';
import { useNavigate } from 'react-router-dom';
import { getTopicProgress } from '../services/progress/ProgressService';

interface JwtPayload {
    TaiKhoan?: string;
    TenDayDu?: string;
    VaiTro?: string;
}

const MyTopics: React.FC = () => {
    const [topics, setTopics] = useState<TopicLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
    const displayName = user?.TenDayDu || user?.TaiKhoan;
    const displayRole = user?.VaiTro || null;
    const isCommitteeRole = displayRole?.toLowerCase().includes('hội đồng');
    const isAdvisorRole = displayRole?.toLowerCase().includes('người hướng dẫn');
    

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            let data = [];

            if (isCommitteeRole) {
                var state = "Chờ phê duyệt";
                data = await getPendingTopics(state);
            } else if (isAdvisorRole) {
                data = await getMyTopics();
            }
            else data = await getMyTopics();

            const topicsWithProgress = await Promise.all(
                data.map(async (topic) => {
                    try {
                        const progressData = await getTopicProgress(topic.MaDT);
                        return { ...topic, progress: progressData.PhanTramTongThe };
                    } catch (error) {
                        return { ...topic, progress: topic.progress ?? 0 };
                    }
                })
            );

            setTopics(topicsWithProgress);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu đề tài');
            console.error(error);
        } finally {
            setLoading(false);
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
            "Chờ phân công hội đồng theo dõi": { color: 'gold', label: 'Chờ phân công hội đồng theo dõi' },
            "Chờ phân công hội đồng nghiệm thu": { color: 'gold', label: 'Chờ phân công hội đồng nghiệm thu' },
            "Từ chối": { color: 'red', label: 'Từ chối' },
            "Chờ nghiệm thu": { color: 'gold', label: 'Chờ nghiệm thu' },
            "Đang nghiệm thu": { color: 'processing', label: 'Đang nghiệm thu' },
            "Đã nghiệm thu": { color: 'green', label: 'Đã nghiệm thu' },
            "Không đạt nghiệm thu": { color: 'red', label: 'Không đạt nghiệm thu' },
        };
        const statusInfo = statusMap[status] || { color: 'default', label: 'Không xác định' };
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
    };

    const getApprovalSender = (record: TopicLoad) => {
        return record.ThanhVienDT?.[0]?.TaiKhoan || 'Không rõ';
    };

    const getApprovalDate = (record: TopicLoad) => {
        const extra = record as any;
        const dateValue = extra.NgayTao || "";
        if (!dateValue) return '-';
        const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        return isNaN(dateObj.getTime()) ? String(dateValue) : dateObj.toLocaleDateString('vi-VN');
    };

    const getStudentName = (record: TopicLoad) => {
        const extra = record as any;
        return extra.TenSinhVien || extra.TaiKhoan || 'Không rõ';
    };

    const canDeleteTopic = (record: TopicLoad) => {
        const memberRecord = record as TopicLoad & {
            DeTai?: TopicLoad;
            VaiTroDT?: string;
        };
        return memberRecord.VaiTroDT === 'Nhóm trưởng'
            && memberRecord.DeTai?.TrangThai === 'Nháp';
    };

    const handleDeleteProject = async (maDT: string) => {
        try {
            await deleteProject(maDT);
            message.success('Đã xóa đề tài');
            await fetchTopics();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa đề tài');
        }
    };
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
    const [memberRoleFilter, setMemberRoleFilter] = useState<string | undefined>();
    const [progressFilter, setProgressFilter] = useState<string | undefined>();

    // Lấy tên đề tài dù cấu trúc dữ liệu khác nhau giữa các role
    const getTopicName = (record: any): string => record?.DeTai?.TenDT || record?.TenDT || '';
    const getTopicStatus = (record: any): string => record?.DeTai?.TrangThai || record?.TrangThai || '';
    const getTopicCategory = (record: any): string => record?.DeTai?.PhanLoai || record?.PhanLoai || '';
    const getTopicRole = (record: any): string => record?.VaiTroDT || '';
    const getTopicProgressValue = (record: any): number => Number(record?.progress ?? record?.DeTai?.TienDo ?? record?.TienDo ?? 0);

    const filteredTopics = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        return topics.filter((topic) => {
            const matchKeyword = !search || [
                topic.MaDT,
                getTopicName(topic),
                getTopicCategory(topic),
            ].some((value) => value.toLowerCase().includes(search));
            const matchStatus = !statusFilter || getTopicStatus(topic) === statusFilter;
            const matchCategory = !categoryFilter || getTopicCategory(topic) === categoryFilter;
            const matchMemberRole = !memberRoleFilter || getTopicRole(topic) === memberRoleFilter;
            const progress = getTopicProgressValue(topic);
            const matchProgress = !progressFilter
                || (progressFilter === 'under50' && progress < 50)
                || (progressFilter === 'from50to99' && progress >= 50 && progress < 100)
                || (progressFilter === 'complete' && progress >= 100);
            return matchKeyword && matchStatus && matchCategory && matchMemberRole && matchProgress;
        });
    }, [topics, keyword, statusFilter, categoryFilter, memberRoleFilter, progressFilter]);

    // Danh sách trạng thái để đổ vào Select, tự rút ra từ dữ liệu đang có (tránh hard-code thiếu trạng thái)
    const statusOptions = useMemo(() => {
        const statusMap: Record<string, string> = {
            "Nháp": "Nháp",
            "Đã phê duyệt": "Bắt đầu",
            "Sắp hạn": "Sắp hạn",
            "Khẩn cấp": "Khẩn cấp",
            "Chờ phê duyệt": "Chờ phê duyệt",
            "Từ chối": "Từ chối",
        };
        const uniqueStatuses = Array.from(new Set(topics.map((topic) => getTopicStatus(topic)).filter(Boolean)));
        return uniqueStatuses.map((value) => ({ value, label: statusMap[value] || value }));
    }, [topics]);

    const categoryOptions = useMemo(() => {
        const categories = Array.from(new Set(topics.map((topic) => getTopicCategory(topic)).filter(Boolean)));
        return categories.map((value) => ({ value, label: value }));
    }, [topics]);

    const memberRoleOptions = useMemo(() => {
        const roles = Array.from(new Set(topics.map((topic) => getTopicRole(topic)).filter(Boolean)));
        return roles.map((value) => ({ value, label: value }));
    }, [topics]);

    const resetFilters = () => {
        setKeyword('');
        setStatusFilter(undefined);
        setCategoryFilter(undefined);
        setMemberRoleFilter(undefined);
        setProgressFilter(undefined);
    };

    const activeFilterCount = [
        statusFilter,
        categoryFilter,
        memberRoleFilter,
        progressFilter,
    ].filter(Boolean).length;

    const filterContent = (
        <Space direction="vertical" size={12} style={{ width: 260 }}>
            {!isCommitteeRole && (
                <Select
                    allowClear
                    placeholder="Trạng thái"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                />
            )}
            {!isCommitteeRole && (
                <Select
                    allowClear
                    placeholder="Phân loại"
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={categoryOptions}
                />
            )}
            {!isCommitteeRole && !isAdvisorRole && (
                <Select
                    allowClear
                    placeholder="Vai trò trong nhóm"
                    value={memberRoleFilter}
                    onChange={setMemberRoleFilter}
                    options={memberRoleOptions}
                />
            )}
            {!isCommitteeRole && (
                <Select
                    allowClear
                    placeholder="Tiến độ"
                    value={progressFilter}
                    onChange={setProgressFilter}
                    options={[
                        { value: 'under50', label: 'Dưới 50%' },
                        { value: 'from50to99', label: 'Từ 50% đến 99%' },
                        { value: 'complete', label: 'Hoàn thành (100%)' },
                    ]}
                />
            )}
            <Button block onClick={resetFilters}>Đặt lại bộ lọc</Button>
        </Space>
    );

    const studentColumns: ColumnsType<TopicLoad> = [
        {
            title: 'STT',
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên đề tài',
            dataIndex: ["DeTai", "TenDT"],
            key: 'TenDT',
            ellipsis: true,
            width: 250,
        },
        {
            title: 'Phân loại',
            dataIndex: ["DeTai", "PhanLoai"],
            key: 'PhanLoai',
            width: 150,
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            width: 100,
            render: (progress: number) => (
                <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 20 }}>
                    <div
                        style={{
                            background: progress >= 80 ? '#52c41a' : progress >= 50 ? '#1890ff' : '#ff4d4f',
                            height: '100%',
                            width: `${progress}%`,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: "VaiTroDT",
            key: 'VaiTroDT',
            width: 120,
        },
        {
            title: 'Trạng thái',
            dataIndex: ["DeTai", "TrangThai"],
            key: 'TrangThai',
            width: 120,
            render: (status?: string) => getStatusTag(status || ""),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record: TopicLoad) => {
                const topic = (record as any).DeTai || record;
                const isLeader = (record as any).VaiTroDT === 'Nhóm trưởng';
                return <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        title={`Xem`}
                        onClick={() => navigate(`/mainhome/topic/${record.MaDT}`)}
                    />
                    {canDeleteTopic(record) && (
                        <Popconfirm
                            title="Xóa đề tài"
                            description="Bạn có chắc muốn xóa đề tài này? Thao tác không thể hoàn tác."
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDeleteProject(record.MaDT)}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />} title="Xóa đề tài" />
                        </Popconfirm>
                    )}
                    {isLeader && ['Chờ nghiệm thu', 'Đang nghiệm thu', 'Đã nghiệm thu', 'Không đạt nghiệm thu'].includes(topic.TrangThai) && (
                        <Button size="small" icon={<FileTextOutlined />} title="Hồ sơ nghiệm thu" onClick={() => navigate(`/mainhome/acceptance/${record.MaDT}`)} />
                    )}
                </Space>;
            },
        },
    ];

    const approvalColumns: ColumnsType<TopicLoad> = [
        {
            title: 'STT',
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên đề tài',
            dataIndex: "TenDT",
            key: 'TenDT',
            ellipsis: true,
            width: 250,
        },
        {
            title: 'Phân loại',
            dataIndex: "PhanLoai",
            key: 'PhanLoai',
            width: 150,
        },
        {
            title: 'Người gửi',
            key: 'NguoiGui',
            width: 150,
            render: (_, record) => getApprovalSender(record),
        },
        {
            title: 'Ngày gửi',
            key: 'NgayGui',
            width: 150,
            render: (_, record) => getApprovalDate(record),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record: TopicLoad) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    title={`Xem đề tài`}
                    onClick={() => navigate(`/mainhome/topic-committee/${record.MaDT}`)}
                >
                </Button>
            ),
        },
    ];

    const advisorColumns: ColumnsType<TopicLoad> = [
        {
            title: 'STT',
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên đề tài',
            dataIndex: ["DeTai", "TenDT"],
            key: 'TenDT',
            ellipsis: true,
            width: 250,
        },
        {
            title: 'Phân loại',
            dataIndex: ["DeTai", "PhanLoai"],
            key: 'PhanLoai',
            width: 150,
        },
        {
            title: 'Sinh viên',
            key: 'SinhVien',
            width: 180,
            render: (_, record) => getStudentName(record),
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            width: 100,
            render: (progress: number) => (
                <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 20 }}>
                    <div
                        style={{
                            background: progress >= 80 ? '#52c41a' : progress >= 50 ? '#1890ff' : '#ff4d4f',
                            height: '100%',
                            width: `${progress}%`,
                            transition: 'width 0.3s',
                        }}
                    />
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: ["DeTai", "TrangThai"],
            key: 'TrangThai',
            width: 120,
            render: (status?: string) => getStatusTag(status || ""),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_, record: TopicLoad) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    title={`Xem đề tài`}
                    onClick={() => navigate(`/mainhome/topic/${record.MaDT}`)}
                >
                    Xem
                </Button>
            ),
        },
    ];

    const currentColumns = isCommitteeRole ? approvalColumns : isAdvisorRole ? advisorColumns : studentColumns;
    const pageTitle = isCommitteeRole ? 'Đề tài chờ phê duyệt' : isAdvisorRole ? 'Đề tài đang hướng dẫn' : 'Đề tài của tôi';
    return (
        <>
            {user && (
                <div style={{ background: '#fff', padding: 20, borderRadius: 4, marginBottom: 16 }}>
                    <h2 style={{ color: '#333', margin: 0 }}>
                        Chào mừng trở lại, <strong>{displayName}</strong> — {displayRole}
                    </h2>

                </div>
            )}
            <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
                <h2>{pageTitle}</h2>

                <Space style={{ marginBottom: 16, display: 'flex' }} wrap>
                    <Input.Search
                        allowClear
                        placeholder="Tìm theo mã, tên hoặc phân loại đề tài..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        style={{ width: 320 }}
                    />
                    {!isCommitteeRole && (
                        <Popover content={filterContent} trigger="click" placement="bottomLeft">
                            <Button icon={<FilterOutlined />}>
                                Bộ lọc{activeFilterCount ? ` (${activeFilterCount})` : ''}
                            </Button>
                        </Popover>
                    )}
                </Space>

                <Spin spinning={loading}>
                    <Table
                        columns={currentColumns}
                        dataSource={filteredTopics}
                        rowKey="MaDT"
                        pagination={{ pageSize: 10 }}
                        scroll={{ x: 1000 }}
                    />
                </Spin>
            </div>
            
        </>
    );
};

export default MyTopics;

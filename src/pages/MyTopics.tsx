import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Table, Tag, Space, Button, message, Spin } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getMyTopics, getPendingTopics } from './Quản lý thông tin đề án/TopicService';
import type { TopicLoad } from './Quản lý thông tin đề án/TopicService';
import { useNavigate } from 'react-router-dom';

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

            setTopics(data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu đề tài');
            console.error(error);
        } finally {
            setLoading(false);
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
                <div style={{ position: 'relative' }}>
                    <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 20 }}>
                        <div
                            style={{
                                background: progress >= 80 ? '#52c41a' : progress >= 50 ? '#1890ff' : '#ff4d4f',
                                height: '100%',
                                width: `${progress}%`,
                                transition: 'width 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 12,
                            }}
                        >
                            {progress > 0 && `${progress}%`}
                        </div>
                    </div>
                    {progress === 0 && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#666' }}>
                            0%
                        </div>
                    )}
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
            render: (_, record: TopicLoad) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        title={`Xem`}
                        onClick={() => navigate(`/mainhome/topic/${record.MaDT}`)}
                    />

                </Space>
            ),
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
                <div style={{ position: 'relative' }}>
                    <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height: 20 }}>
                        <div
                            style={{
                                background: progress >= 80 ? '#52c41a' : progress >= 50 ? '#1890ff' : '#ff4d4f',
                                height: '100%',
                                width: `${progress}%`,
                                transition: 'width 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 12,
                            }}
                        >
                            {progress > 0 && `${progress}%`}
                        </div>
                    </div>
                    {progress === 0 && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#666' }}>
                            0%
                        </div>
                    )}
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
                <Spin spinning={loading}>
                    <Table
                        columns={currentColumns}
                        dataSource={topics}
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

import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Spin } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getPendingTopics } from './ThongTinDeTai/TopicService';
import type { TopicLoad } from './ThongTinDeTai/TopicService';
import { useNavigate } from 'react-router-dom';

const ApprovedTopics: React.FC = () => {
    const [topics, setTopics] = useState<TopicLoad[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            var sate = "Đã phê duyệt";
            setLoading(true);
            const data = await getPendingTopics(sate);
            setTopics(data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu đề tài đã xét duyệt');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getApprovalSender = (record: TopicLoad) => {
        return record.ThanhVienDT?.[0]?.TaiKhoan || 'Không rõ';
    };

    const getApprovalDate = (record: TopicLoad) => {
        const extra = record as any;
        const dateValue = extra.NgayXetDuyet;
        if (!dateValue) return '-';
        const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        return isNaN(dateObj.getTime()) ? String(dateValue) : dateObj.toLocaleDateString('vi-VN');
    };

    const columns: ColumnsType<TopicLoad> = [
        {
            title: 'STT',
            width: 50,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên đề tài',
            dataIndex: 'TenDT',
            key: 'TenDT',
            ellipsis: true,
            width: 250,
        },
        {
            title: 'Phân loại',
            dataIndex: 'PhanLoai',
            key: 'PhanLoai',
            width: 150,
        },
        {
            title: 'Người gửi',
            key: 'NguoiGui',
            width: 180,
            render: (_, record) => getApprovalSender(record),
        },
        {
            title: 'Ngày duyệt',
            key: 'NgayDuyet',
            width: 150,
            render: (_, record) => getApprovalDate(record), // Giả sử dùng ngày gửi làm ngày duyệt
        },
        {
            title: 'Trạng thái',
            key: 'TrangThai',
            width: 120,
            render: () => <Tag color="green">Đã xét duyệt</Tag>,
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
                    title="Xem đề tài"
                    onClick={() => navigate(`/mainhome/topic/${record.MaDT}`)}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <h2>Đề tài đã xét duyệt</h2>
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={topics}
                    rowKey="MaDT"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                />
            </Spin>
        </div>
    );
};

export default ApprovedTopics;
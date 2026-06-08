import React, { useState, useEffect } from 'react';
import { Table, Button, message, Spin, Badge, Modal, Input, Divider, Select, Row, Col } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getNotifications } from './Quản lý thông tin đề án/NotificationService';
import type { Notification } from './Quản lý thông tin đề án/NotificationService';
import ApiAxios from '../axios.config';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchText, setSearchText] = useState<string>('');

    // State xóa đơn
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<Notification | null>(null);

    // State xóa nhiều
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu thông báo');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewNotification = async (record: Notification) => {
        setSelectedNotification(record);
        setModalOpen(true);
        setReplyText('');
        try {
            await ApiAxios.patch(`/notifications/read/${record.idThongBao}`, {
                TrangThai: true
            });
            setNotifications(prev =>
                prev.map(n =>
                    n.idThongBao === record.idThongBao ? { ...n, TrangThai: true } : n
                )
            );
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
        }
    };

    // Xóa đơn
    const handleDeleteNotification = async () => {
        if (!selectedToDelete) return;
        try {
            await ApiAxios.delete(`/notifications/${selectedToDelete.idThongBao}`);
            setNotifications(prev =>
                prev.filter(n => n.idThongBao !== selectedToDelete.idThongBao)
            );
            message.success('Đã xóa thông báo');
        } catch (error) {
            message.error('Lỗi khi xóa thông báo');
        } finally {
            setDeleteModalOpen(false);
            setSelectedToDelete(null);
        }
    };

    // Xóa nhiều
    const handleBulkDelete = async () => {
        try {
            await Promise.all(
                selectedRowKeys.map(key =>
                    ApiAxios.delete(`/notifications/${key}`)
                )
            );
            setNotifications(prev =>
                prev.filter(n => !selectedRowKeys.includes(n.idThongBao))
            );
            message.success(`Đã xóa ${selectedRowKeys.length} thông báo`);
            setSelectedRowKeys([]);
        } catch (error) {
            message.error('Lỗi khi xóa thông báo');
        } finally {
            setBulkDeleteModalOpen(false);
        }
    };

    const getFilteredNotifications = () => {
        let filtered = notifications;
        if (statusFilter === 'read') {
            filtered = filtered.filter(n => n.TrangThai);
        } else if (statusFilter === 'unread') {
            filtered = filtered.filter(n => !n.TrangThai);
        }
        if (searchText.trim()) {
            filtered = filtered.filter(n =>
                n.TieuDe.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        return filtered;
    };

    const columns: ColumnsType<Notification> = [
        {
            title: 'STT',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'TieuDe',
            key: 'TieuDe',
            ellipsis: true,
            render: (text: string, record: Notification) => (
                <span>
                    {!record.TrangThai && <Badge status="processing" />}
                    {text}
                </span>
            ),
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'NgayTao',
            key: 'NgayTao',
            width: 150,
            render: (date: Date) => new Date(date).toLocaleString(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'TrangThai',
            key: 'TrangThai',
            width: 120,
            render: (TrangThai: boolean) => (
                <Badge
                    status={TrangThai ? 'success' : 'processing'}
                    text={TrangThai ? 'Đã đọc' : 'Chưa đọc'}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewNotification(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            setSelectedToDelete(record);
                            setDeleteModalOpen(true);
                        }}
                    />
                </div>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: 20, borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>🔔 THÔNG BÁO</h2>

                {/* Nút xóa nhiều — chỉ hiện khi đã chọn */}
                {selectedRowKeys.length > 0 && (
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setBulkDeleteModalOpen(true)}
                    >
                        Xóa đã chọn ({selectedRowKeys.length})
                    </Button>
                )}
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}>
                        <Input.Search
                            placeholder="Tìm kiếm thông báo..."
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                            options={[
                                { label: 'Tất cả thông báo', value: 'all' },
                                { label: 'Đã đọc', value: 'read' },
                                { label: 'Chưa đọc', value: 'unread' },
                            ]}
                        />
                    </Col>
                </Row>
            </div>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={getFilteredNotifications()}
                    rowKey={(record) => record.idThongBao}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                    rowClassName={(record) => record.TrangThai ? '' : 'unread-row'}
                    // Checkbox chọn nhiều
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                    }}
                />
            </Spin>

            {/* Modal xem thông báo */}
            <Modal
                title="NỘI DUNG THÔNG BÁO"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={[
                    <Button key="cancel" danger onClick={() => setModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={() => {
                            message.success('Phản hồi đã được gửi');
                            setModalOpen(false);
                            setReplyText('');
                        }}
                    >
                        Trả lời
                    </Button>,
                ]}
                width={800}
            >
                {selectedNotification && (
                    <div>
                        <div style={{ marginBottom: 20 }}>
                            <p><strong>Người gửi:</strong> {selectedNotification.TaiKhoan || 'Không rõ'}</p>
                            <p><strong>Ngày gửi:</strong> {new Date(selectedNotification.NgayTao).toLocaleString()}</p>
                        </div>
                        <Divider />
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontWeight: 'bold' }}>Nội dung:</p>
                            <div style={{
                                padding: 12,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 4,
                                minHeight: 100,
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                            }}>
                                {selectedNotification.NoiDung}
                            </div>
                        </div>
                        <Divider />
                        <div>
                            <p style={{ fontWeight: 'bold' }}>Phản hồi:</p>
                            <Input.TextArea
                                rows={5}
                                placeholder="Nhập phản hồi..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal xác nhận xóa đơn */}
            <Modal
                title="Xác nhận xóa thông báo"
                open={deleteModalOpen}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setSelectedToDelete(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setDeleteModalOpen(false);
                        setSelectedToDelete(null);
                    }}>
                        Hủy
                    </Button>,
                    <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDeleteNotification}>
                        Xóa
                    </Button>,
                ]}
            >
                <p>Bạn có chắc chắn muốn xóa thông báo <strong>"{selectedToDelete?.TieuDe}"</strong> không?</p>
            </Modal>

            {/* Modal xác nhận xóa nhiều */}
            <Modal
                title="Xác nhận xóa nhiều thông báo"
                open={bulkDeleteModalOpen}
                onCancel={() => setBulkDeleteModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setBulkDeleteModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                        Xóa {selectedRowKeys.length} thông báo
                    </Button>,
                ]}
            >
                <p>Bạn có chắc chắn muốn xóa <strong>{selectedRowKeys.length} thông báo</strong> đã chọn không?</p>
            </Modal>
        </div>
    );
};

export default Notifications;
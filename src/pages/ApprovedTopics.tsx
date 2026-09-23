import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Popover, Select, Space, Spin, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { EyeOutlined, FileTextOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getDeTaiTheoHoiDong } from '../services/progress/ProgressService';
import type { DeTaiTheoDoi } from '../services/progress/ProgressService';

type CouncilWorkTab = 'approval' | 'monitoring' | 'final-acceptance' | 'partial-acceptance' | 'other';

const businessLabels: Record<string, string> = {
  approval: 'Xét duyệt',
  monitoring: 'Theo dõi',
  scoring: 'Nghiệm thu',
  liquidation: 'Thanh lý',
  other: 'Khác',
};

export default function ApprovedTopics() {
  const [topics, setTopics] = useState<DeTaiTheoDoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [activeWorkTab, setActiveWorkTab] = useState<CouncilWorkTab>('approval');
  const [statusFilter, setStatusFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const navigate = useNavigate();

  const loadTopics = async () => {
    try {
      setLoading(true);
      setTopics(await getDeTaiTheoHoiDong());
    } catch {
      message.error('Không tải được đề tài được phân công');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTopics();
  }, []);

  const facultyOptions = useMemo(
    () => [...new Set(topics.map((topic) => topic.Khoa).filter(Boolean))],
    [topics],
  );
  const statusOptions = useMemo(
    () => [...new Set(topics.map((topic) => topic.TrangThai).filter(Boolean))],
    [topics],
  );
  const filteredTopics = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase('vi-VN');
    return topics.filter((topic) => {
      const matchesKeyword = !normalizedKeyword || [
        topic.MaDT,
        topic.TenDT,
        topic.ChuNhiem,
        topic.TenHoiDong,
      ].some((value) => value?.toLocaleLowerCase('vi-VN').includes(normalizedKeyword));
      const matchesStatus = statusFilter === 'all' || topic.TrangThai === statusFilter;
      const matchesFaculty = facultyFilter === 'all' || topic.Khoa === facultyFilter;

      return matchesKeyword && matchesStatus && matchesFaculty;
    });
  }, [topics, keyword, statusFilter, facultyFilter]);

  const matchesWorkTab = (topic: DeTaiTheoDoi, tab: CouncilWorkTab) => {
    if (tab === 'approval') return topic.NghiepVuHoiDong === 'approval';
    if (tab === 'monitoring') return topic.NghiepVuHoiDong === 'monitoring';
    if (tab === 'final-acceptance') {
      return topic.NghiepVuHoiDong === 'scoring' && topic.LoaiNghiemThu !== 'tung-phan';
    }
    if (tab === 'partial-acceptance') {
      return topic.NghiepVuHoiDong === 'scoring' && topic.LoaiNghiemThu === 'tung-phan';
    }
    return !['approval', 'monitoring', 'scoring'].includes(topic.NghiepVuHoiDong || '');
  };

  const visibleTopics = useMemo(
    () => filteredTopics.filter((topic) => matchesWorkTab(topic, activeWorkTab)),
    [filteredTopics, activeWorkTab],
  );

  const workTabItems = useMemo(() => {
    const count = (tab: CouncilWorkTab) => filteredTopics.filter((topic) => matchesWorkTab(topic, tab)).length;
    return [
      { key: 'approval', label: `Xét duyệt (${count('approval')})` },
      { key: 'monitoring', label: `Theo dõi (${count('monitoring')})` },
      { key: 'final-acceptance', label: `Nghiệm thu toàn bộ (${count('final-acceptance')})` },
      { key: 'partial-acceptance', label: `Nghiệm thu từng phần (${count('partial-acceptance')})` },
      { key: 'other', label: `Khác (${count('other')})` },
    ];
  }, [filteredTopics]);

  const resetFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setFacultyFilter('all');
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    facultyFilter !== 'all',
  ].filter(Boolean).length;

  const filterContent = (
    <Space direction="vertical" size={12} style={{ width: 260 }}>
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: 'all', label: 'Tất cả trạng thái' },
          ...statusOptions.map((value) => ({ value, label: value })),
        ]}
      />
      <Select
        value={facultyFilter}
        onChange={setFacultyFilter}
        options={[
          { value: 'all', label: 'Tất cả khoa' },
          ...facultyOptions.map((value) => ({ value, label: value })),
        ]}
      />
      
      <Button block onClick={resetFilters}>Đặt lại bộ lọc</Button>
    </Space>
  );

  const renderEllipsisText = (value?: string) => (
    <Tooltip title={value || '—'}>
      <Typography.Text ellipsis style={{ display: 'block', maxWidth: '100%' }}>
        {value || '—'}
      </Typography.Text>
    </Tooltip>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Đề tài được phân công cho hội đồng</h2>
            <Typography.Text type="secondary">Theo dõi các đề tài thuộc hội đồng của bạn</Typography.Text>
          </div>
          <Tag color="blue" style={{ margin: 0 }}>{visibleTopics.length} đề tài</Tag>
        </div>

        <Space wrap size={[10, 10]} style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm mã, tên đề tài, chủ nhiệm, hội đồng..."
            style={{ width: 320 }}
          />
          <Popover content={filterContent} trigger="click" placement="bottomLeft">
            <Button icon={<FilterOutlined />}>
              Bộ lọc{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </Popover>
        </Space>

        <Tabs
          activeKey={activeWorkTab}
          onChange={(key) => setActiveWorkTab(key as CouncilWorkTab)}
          items={workTabItems}
          style={{ marginBottom: 12 }}
        />

        <Spin spinning={loading}>
          <Table
            rowKey={(topic) => `${topic.MaDT}-${topic.MaHoiDong || topic.NghiepVuHoiDong}-${topic.MaBaoCaoTienDo || 'project'}`}
            dataSource={visibleTopics}
            tableLayout="fixed"
            scroll={{ x: 1220 }}
            pagination={{ showSizeChanger: false, showTotal: (total) => `${total} đề tài` }}
            columns={[
            { title: 'Mã đề tài', dataIndex: 'MaDT', width: 96, align: 'center', ellipsis: true },
            { title: 'Tên đề tài', dataIndex: 'TenDT', width: 250, render: (value: string) => renderEllipsisText(value) },
            { title: 'Hội đồng', dataIndex: 'TenHoiDong', width: 210, render: (value: string) => renderEllipsisText(value) },
            {
              title: 'Nghiệp vụ',
              dataIndex: 'NghiepVuHoiDong',
              width: 120,
              align: 'center',
              render: (value: string, row: DeTaiTheoDoi) => (
                <Tag style={{ margin: 0 }}>
                  {row.LoaiNghiemThu === 'tung-phan' ? 'Nghiệm thu từng phần' : businessLabels[value] || value}
                </Tag>
              ),
            },
            { title: 'Người gửi', dataIndex: 'ChuNhiem', width: 160, render: (value: string) => renderEllipsisText(value) },
            {
              title: 'Vai trò trong hội đồng',
              dataIndex: 'VaiTroTrongHoiDong',
              width: 180,
              align: 'center',
              render: (value: string) => <Tag color="purple" style={{ margin: 0 }}>{value || 'Thành viên'}</Tag>,
            },
            {
              title: 'Thao tác',
              width: 180,
              align: 'right',
              render: (_: unknown, row: DeTaiTheoDoi) => {
                const secondaryAction = row.NghiepVuHoiDong === 'monitoring' ? (
                  <Tooltip title="Xem báo cáo tiến độ">
                    <Button
                      size="middle"
                      icon={<FileTextOutlined />}
                      aria-label="Xem báo cáo tiến độ"
                      onClick={() => navigate(`/mainhome/hoi-dong-theo-doi/${row.MaDT}`)}
                    />
                  </Tooltip>
                ) : row.NghiepVuHoiDong === 'scoring' ? (
                  <Tooltip title={row.LoaiNghiemThu === 'tung-phan' ? 'Mở hồ sơ nghiệm thu từng phần' : 'Mở hồ sơ nghiệm thu'}>
                    <Button
                      size="middle"
                      icon={<FileTextOutlined />}
                      aria-label={row.LoaiNghiemThu === 'tung-phan' ? 'Mở hồ sơ nghiệm thu từng phần' : 'Mở hồ sơ nghiệm thu'}
                      onClick={() => navigate(
                        row.LoaiNghiemThu === 'tung-phan'
                          ? `/mainhome/hoi-dong-theo-doi/${row.MaDT}?reportId=${row.MaBaoCaoTienDo}`
                          : `/mainhome/acceptance/${row.MaDT}`,
                      )}
                    />
                  </Tooltip>
                ) : null;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 32px', gap: 6, justifyContent: 'end' }}>
                    <Tooltip title="Xem chi tiết đề tài">
                      <Button
                        type="primary"
                        size="middle"
                        icon={<EyeOutlined />}
                        aria-label="Xem chi tiết đề tài"
                        onClick={() => navigate(`/mainhome/topic-committee/${row.MaDT}`)}
                      />
                    </Tooltip>
                    {secondaryAction || <span aria-hidden="true" />}
                  </div>
                );
              },
            },
            ]}
          />
        </Spin>
      </div>
    </div>
  );
}

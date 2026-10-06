import React from 'react';
import { Table, Button, Badge, Space, Descriptions, Grid } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MocTienDo } from '../../services/progress/ProgressService';

interface ProgressTableProps {
  mocList: MocTienDo[] | undefined;
  searchText: string;
  loading: boolean;
  isCommitteeRole: boolean;
  canManageMoc: boolean;
  onView: (moc: MocTienDo) => void;
  onEdit: (moc: MocTienDo) => void;
  onDelete: (moc: MocTienDo) => void;
  onUpload: (moc: MocTienDo) => void;
}

/**
 * Hiển thị các mốc tiến độ dưới dạng bảng, kèm thao tác theo vai trò.
 */
const ProgressTable: React.FC<ProgressTableProps> = ({
  mocList, searchText, loading, isCommitteeRole, canManageMoc,
  onView, onEdit, onDelete, onUpload,
}) => {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  if (!mocList) return <div>Không có dữ liệu</div>;

  const dataSource = mocList.filter((moc) =>
    moc.TenMoc.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusBadge = (status: string) => (
    <Badge
      status={
        status === 'Hoàn thành'
          ? 'success'
          : status === 'Trễ hạn'
            ? 'error'
            : status === 'Sắp hạn'
              ? 'warning'
              : 'processing'
      }
      text={status}
    />
  );

  const desktopColumns: any[] = [
    {
      title: 'Thứ tự',
      dataIndex: 'ThuTu',
      key: 'ThuTu',
      width: 80,
      sorter: (a: MocTienDo, b: MocTienDo) => a.ThuTu - b.ThuTu,
    },
    {
      title: 'Tên mốc',
      dataIndex: 'TenMoc',
      key: 'TenMoc',
    },
    {
      title: 'Thời gian',
      key: 'ThoiGian',
      width: 220,
      render: (moc: MocTienDo) => `${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Trọng số',
      dataIndex: 'TrongSo',
      key: 'TrongSo',
      width: 100,
      render: (value: number) => `${value}%`,
    },
    {
      title: 'Trạng thái',
      key: 'TrangThai',
      width: 140,
      render: (moc: MocTienDo) => getStatusBadge(moc.TrangThai),
    },
  ];

  if (!isCommitteeRole) {
    desktopColumns.push({
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      render: (moc: MocTienDo) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => onView(moc)}
          >
            Xem
          </Button>

          {canManageMoc ? (
            <>
              <Button
                size="small"
                type="primary"
                icon={<EditOutlined />}
                onClick={() => onEdit(moc)}
              >
                Sửa
              </Button>

              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(moc)}
              >
                Xóa
              </Button>
            </>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<UploadOutlined />}
              style={{
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
              }}
              disabled={moc.TrangThai === 'Trễ hạn'}
              onClick={() => onUpload(moc)}
            >
              Nộp
            </Button>
          )}
        </Space>
      ),
    });
  }

  const mobileColumns: any[] = [
    {
      title: 'Mốc tiến độ',
      key: 'TenMoc',
      render: (moc: MocTienDo) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1f1f1f', fontSize: 14, lineHeight: 1.4 }}>
            #{moc.ThuTu}. {moc.TenMoc}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            Trọng số: <strong style={{ color: '#262626' }}>{moc.TrongSo}%</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'TrangThai',
      width: 130,
      align: 'right' as const,
      render: (moc: MocTienDo) => getStatusBadge(moc.TrangThai),
    },
  ];

  const renderExpandedContent = (moc: MocTienDo) => (
    <div style={{ padding: '6px 2px', background: '#fafafa', borderRadius: 6 }}>
      <Descriptions size="small" column={1} bordered={false}>
        <Descriptions.Item label="Thời hạn">
          {dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} — {dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}
        </Descriptions.Item>
        {moc.MoTa && (
          <Descriptions.Item label="Mô tả">
            {moc.MoTa}
          </Descriptions.Item>
        )}
        {moc.GhiChu && (
          <Descriptions.Item label="Ghi chú">
            {moc.GhiChu}
          </Descriptions.Item>
        )}
      </Descriptions>

      {!isCommitteeRole && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #d9d9d9', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); onView(moc); }}
          >
            Chi tiết
          </Button>

          {canManageMoc ? (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); onEdit(moc); }}
              >
                Chỉnh sửa
              </Button>

              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => { e.stopPropagation(); onDelete(moc); }}
              >
                Xóa
              </Button>
            </>
          ) : (
            <Button
              size="small"
              type="primary"
              icon={<UploadOutlined />}
              style={{
                backgroundColor: '#52c41a',
                borderColor: '#52c41a',
              }}
              disabled={moc.TrangThai === 'Trễ hạn'}
              onClick={(e) => { e.stopPropagation(); onUpload(moc); }}
            >
              Nộp minh chứng
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Table
      columns={isMobile ? mobileColumns : desktopColumns}
      dataSource={dataSource}
      rowKey="MaMoc"
      loading={loading}
      pagination={false}
      size={isMobile ? 'small' : 'middle'}
      scroll={isMobile ? undefined : { x: 800 }}
      expandable={isMobile ? {
        expandedRowRender: renderExpandedContent,
        expandRowByClick: true,
      } : undefined}
    />
  );
};

export default ProgressTable;

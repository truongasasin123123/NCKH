import React from 'react';
import { Table, Button, Badge, Space } from 'antd';
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
  if (!mocList) return <div>Không có dữ liệu</div>;

  const dataSource = mocList.filter((moc) =>
    moc.TenMoc.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: any[] = [
    {
      title: 'Thứ tự',
      dataIndex: 'ThuTu',
      key: 'ThuTu',
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
      render: (moc: MocTienDo) => `${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Trọng số',
      dataIndex: 'TrongSo',
      key: 'TrongSo',
      render: (value: number) => `${value}%`,
    },
    {
      title: 'Trạng thái',
      key: 'TrangThai',
      render: (moc: MocTienDo) => (
        <Badge
          status={
            moc.TrangThai === 'Hoàn thành'
              ? 'success'
              : moc.TrangThai === 'Trễ hạn'
                ? 'error'
                : moc.TrangThai === 'Sắp hạn'
                  ? 'warning'
                  : 'processing'
          }
          text={moc.TrangThai}
        />
      ),
    },
  ];

  if (!isCommitteeRole) {
    columns.push({
      title: 'Thao tác',
      key: 'actions',
      render: (moc: MocTienDo) => (
        <Space>
          <Button
            size="small"
            type="primary"
            className="btn-see"
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
                className="btn-edit"
                icon={<EditOutlined />}
                onClick={() => onEdit(moc)}
              >
                Sửa
              </Button>

              <Button
                size="small"
                type="primary"
                className="btn-delete"
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
              className="btn-upload"
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

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="MaMoc"
      loading={loading}
      pagination={false}
    />
  );
};

export default ProgressTable;

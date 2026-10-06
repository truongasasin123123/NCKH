import React from 'react';
import { Timeline, Card, Badge, Grid } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MocTienDo } from '../../services/progress/ProgressService';

interface ProgressTimelineProps {
  mocList: MocTienDo[] | undefined;
}

/**
 * Hiển thị các mốc tiến độ dưới dạng Timeline.
 */
const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ mocList }) => {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  if (!mocList) {
    return <div>Không có dữ liệu</div>;
  }

  const sortedMocs = [...mocList].sort((a, b) => a.ThuTu - b.ThuTu);

  return (
    <Timeline mode={isMobile ? undefined : 'left'} style={{ padding: isMobile ? '8px 0' : undefined }}>
      {sortedMocs.map((moc) => {
        const status = moc.TrangThai;

        let color = 'gray';
        let icon = <ClockCircleOutlined />;

        switch (status) {
          case 'Hoàn thành':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;

          case 'Trễ hạn':
            color = 'red';
            icon = <CloseCircleOutlined />;
            break;

          case 'Sắp hạn':
            color = 'orange';
            icon = <ExclamationCircleOutlined />;
            break;

          case 'Đang thực hiện':
            color = 'blue';
            break;
        }

        const dateRange = `${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(moc.NgayKetThuc).format('DD/MM/YYYY')}`;

        return (
          <Timeline.Item
            key={moc.MaMoc}
            color={color}
            dot={icon}
            label={isMobile ? undefined : dateRange}
          >
            <Card
              size={isMobile ? 'small' : 'default'}
              style={{ marginBottom: 8 }}
              title={
                <div>
                  <div style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16 }}>#{moc.ThuTu}. {moc.TenMoc}</div>
                  {isMobile && (
                    <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 'normal', marginTop: 2 }}>
                      📅 {dateRange}
                    </div>
                  )}
                </div>
              }
              extra={
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
              }
            >
              {moc.MoTa && <p style={{ marginBottom: 6 }}>{moc.MoTa}</p>}

              <p style={{ marginBottom: moc.GhiChu ? 6 : 0 }}>
                <strong>Trọng số:</strong> {moc.TrongSo}%
              </p>

              {moc.GhiChu && (
                <p style={{ marginBottom: 0 }}>
                  <strong>Ghi chú:</strong> {moc.GhiChu}
                </p>
              )}
            </Card>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

export default ProgressTimeline;

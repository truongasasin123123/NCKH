import React from 'react';
import { Timeline, Card, Badge } from 'antd';
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
  if (!mocList) {
    return <div>Không có dữ liệu</div>;
  }

  const sortedMocs = [...mocList].sort((a, b) => a.ThuTu - b.ThuTu);

  return (
    <Timeline mode="left">
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

        return (
          <Timeline.Item
            key={moc.MaMoc}
            color={color}
            dot={icon}
            label={`${dayjs(moc.NgayBatDau).format('DD/MM/YYYY')} - ${dayjs(
              moc.NgayKetThuc
            ).format('DD/MM/YYYY')}`}
          >
            <Card
              title={moc.TenMoc}
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
              <p>{moc.MoTa}</p>

              <p>
                <strong>Trọng số:</strong> {moc.TrongSo}%
              </p>

              {moc.GhiChu && (
                <p>
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

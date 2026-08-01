import { Button, Card, Input, List, Popconfirm, Space } from 'antd';
import type { ProjectComment } from '../../services/topic/CommentsService';

interface Props {
  comments: ProjectComment[]; visibleCount: number; currentAccount?: string; canComment: boolean;
  value: string; editingId: number | null; editingValue: string;
  onValueChange: (value: string) => void; onCreate: () => void; onStartEdit: (comment: ProjectComment) => void;
  onEditingValueChange: (value: string) => void; onSaveEdit: (id: number) => void; onCancelEdit: () => void;
  onDelete: (id: number) => void; onShowMore: () => void;
}

export default function CommentsPanel(props: Props) {
  const { comments, visibleCount, currentAccount, canComment, value, editingId, editingValue } = props;
  return <Card title="Nhận xét" style={{ marginTop: 16, marginBottom: 24 }}>
    {canComment && <><Input.TextArea rows={4} placeholder="Nhập nhận xét..." value={value} onChange={(event) => props.onValueChange(event.target.value)} /><div style={{ textAlign: 'right', marginTop: 12 }}><Button type="primary" onClick={props.onCreate}>Thêm nhận xét</Button></div></>}
    <List locale={{ emptyText: 'Chưa có nhận xét' }} dataSource={comments.slice(0, visibleCount)} renderItem={(comment) => {
      const editing = editingId === comment.Id; const author = comment.TaiKhoan === currentAccount;
      return <List.Item actions={author && canComment ? [<Button key="edit" type="link" onClick={() => props.onStartEdit(comment)}>Sửa</Button>, <Popconfirm key="delete" title="Xóa nhận xét" onConfirm={() => props.onDelete(comment.Id)}><Button type="link" danger>Xóa</Button></Popconfirm>] : undefined}>
        <div style={{ width: '100%' }}><strong>{comment.NguoiDung?.TenDayDu || comment.TaiKhoan}</strong>{comment.HoiDongs?.length ? <span style={{ color: '#1677ff' }}> · {comment.HoiDongs.join(', ')}</span> : <span style={{ color: '#8c8c8c' }}> · {comment.NguoiDung?.VaiTro || ''}</span>}
          {editing ? <div style={{ marginTop: 8 }}><Input.TextArea rows={3} value={editingValue} onChange={(event) => props.onEditingValueChange(event.target.value)} /><Space style={{ marginTop: 8 }}><Button type="primary" size="small" onClick={() => props.onSaveEdit(comment.Id)}>Lưu</Button><Button size="small" onClick={props.onCancelEdit}>Hủy</Button></Space></div> : <p style={{ margin: '8px 0 0' }}>{comment.NoiDung}</p>}
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 6 }}>{new Date(comment.NgayTao).toLocaleString('vi-VN')}</div>
        </div>
      </List.Item>;
    }} />
    {visibleCount < comments.length && <div style={{ textAlign: 'center', marginTop: 12 }}><Button block onClick={props.onShowMore}>Tải thêm bình luận ({comments.length - visibleCount} còn lại)</Button></div>}
  </Card>;
}

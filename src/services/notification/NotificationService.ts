import ApiAxios from "../../axios.config"

export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed';

export const announceNotificationsChanged = () => {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
};

/* Kiểu dữ liệu */
export interface Notification {
    idThongBao: number;
    TaiKhoan: string;
    TkNguoiNhan: string;
    TieuDe: string;
    NoiDung: string;
    TrangThai: boolean;
    NgayTao: Date;
    content: string;
}

/* API */
export const getNotifications = async (): Promise<Notification[]> => {
    const res = await ApiAxios.get("/notifications/getnotifi");
    return res.data;
};

export const markNotificationAsRead = async (id: number) => {
    await ApiAxios.patch(`/notifications/read/${id}`, { TrangThai: true });
    announceNotificationsChanged();
};

export const createNofitfications = async (TkNguoiNhan: string, TieuDe: string, NoiDung: string) => {
    const res = await ApiAxios.post('/notifications/createnotifi', { TkNguoiNhan, TieuDe, NoiDung });
    return res.data;
}

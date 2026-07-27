import ApiAxios from "../../axios.config"

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
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.data;
};

export const createNofitfications = async (TkNguoiNhan: string, TieuDe: string, NoiDung: string) => {
    const res = await ApiAxios.post('/notifications/createnotifi', { TkNguoiNhan, TieuDe, NoiDung });
    return res.data;
}

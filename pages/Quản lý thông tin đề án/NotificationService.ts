import ApiAxios from "../../axios.config"

/* Kiểu dữ liệu */
export interface Notification {
    TaiKhoan: string;
    idThongBao: number;
    TkNguoiNhan: string;
    TieuDe: string;
    NoiDung: string;
    TrangThai: boolean;
    NgayTao: Date;
    content: string;
}

/* Fake API */
export const getNotifications = async (): Promise<Notification[]> => {
    const res = await ApiAxios.get("/notifications/getnotifi");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.data;
};

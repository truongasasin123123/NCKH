import ApiAxios from '../../axios.config';

export interface CreateAccountPayload {
  TaiKhoan: string;
  MatKhau: string;
  VaiTro: string;
  Gmail?: string | null;
  TrangThaiTaiKhoan: string;
  BatBuocDoiMatKhau: boolean;
}

export const createAccount = async (payload: CreateAccountPayload) => {
  const res = await ApiAxios.post("/users/create-by-admin", payload);
  return res.data;
};
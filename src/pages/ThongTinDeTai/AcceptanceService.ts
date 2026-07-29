import ApiAxios from '../../axios.config';

export type KetQuaNghiemThu = 'Đạt' | 'Yêu cầu bổ sung' | 'Không đạt';

export interface PhieuChamNghiemThu {
  Id: number;
  TaiKhoanHoiDong: string;
  Diem?: number;
  NhanXet?: string;
  TrangThai: string;
  NgayGui?: string;
  NguoiHoiDong?: { TenDayDu?: string; TaiKhoan?: string };
}

export interface HoSoNghiemThu {
  Id: number; MaDT: string; TaiKhoanNguoiGui: string; GhiChu?: string; TrangThai: string;
  DiemTrungBinh?: number; DiemCuoiCung?: number; ChatLuong?: string; KetQuaCuoiCung?: KetQuaNghiemThu;
  NhanXetChuTich?: string; NgayGui?: string; NgayChot?: string;
  TaiLieu?: Array<{ MaTL: number; TenFile: string }>;
  PhieuCham?: PhieuChamNghiemThu[];
}

export const getAcceptanceByProject = async (maDT: string): Promise<HoSoNghiemThu[]> =>
  (await ApiAxios.get(`/acceptance/project/${maDT}`)).data;
export const createAcceptanceDraft = async (maDT: string, GhiChu?: string): Promise<HoSoNghiemThu> =>
  (await ApiAxios.post(`/acceptance/project/${maDT}`, { GhiChu })).data;
export const updateAcceptanceDraft = async (id: number, GhiChu?: string): Promise<HoSoNghiemThu> =>
  (await ApiAxios.patch(`/acceptance/${id}`, { GhiChu })).data;
export const deleteAcceptanceDraft = async (id: number) => { await ApiAxios.delete(`/acceptance/${id}`); };
export const submitAcceptance = async (id: number): Promise<HoSoNghiemThu> =>
  (await ApiAxios.post(`/acceptance/${id}/submit`)).data;
export const submitAcceptanceScore = async (id: number, Diem: number, NhanXet: string) =>
  (await ApiAxios.post(`/acceptance/${id}/scores`, { Diem, NhanXet })).data;
export const finalizeAcceptance = async (id: number, payload: { DiemCuoiCung?: number; ChatLuong: string; KetQua: KetQuaNghiemThu; NhanXetChuTich: string }) =>
  (await ApiAxios.post(`/acceptance/${id}/finalize`, payload)).data;

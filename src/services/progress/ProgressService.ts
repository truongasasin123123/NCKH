import ApiAxios from '../../axios.config';

export interface MocTienDo {
  MaMoc: number; MaDT: string; TenMoc: string; MoTa?: string; ThuTu: number;
  TrongSo: number; GhiChu?: string; TrangThai: string; NgayBatDau: Date; NgayKetThuc: Date;
}
export interface TaoTienDo extends Omit<MocTienDo, 'MaMoc'> { ThanhVienIds?: number[] }
export interface CapNhatTienDo { TenMoc?: string; MoTa?: string; NgayCapNhat: Date; ThuTu?: number; TrongSo?: number; GhiChu?: string; NgayBatDau?: Date; NgayKetThuc?: Date; ThanhVienIds?: number[] }
export interface TopicProgress { MaDT: string; TenDT: string; PhanTramTongThe: number; MocTienDo: MocTienDo[] }
export interface ThanhVienMocDT { Id: number; thanhVien: { idTV: number; VaiTroDT: string; NguoiDung: { TaiKhoan: string; TenDayDu: string; VaiTro: string } } }

export type TrangThaiBaoCao =
  | 'Nháp'
  | 'Đã gửi'
  | 'Yêu cầu bổ sung'
  | 'Yêu cầu điều chỉnh'
  | 'Đề xuất thanh lý'
  | 'Đạt'
  | 'Không đạt';
export type KetLuanBaoCao = 'accepted' | 'supplement' | 'adjustment' | 'liquidation';
export type LoaiBaoCao = 'Theo mốc' | 'Định kỳ' | 'Đột xuất';
export interface BaoCaoTienDo {
  Id: number; MaDT: string; MaMoc?: number; LoaiBaoCao: LoaiBaoCao; KyBaoCao: string; NoiDungBaoCao: string;
  TienDoBaoCao?: number; KhoKhan?: string; DeXuat?: string; TaiKhoanNguoiGui: string;
  TrangThai: TrangThaiBaoCao; NhanXetHoiDong?: string; NgayGui?: string;
  TaiKhoanHoiDong?: string; NgayPhanHoi?: string;
  NguoiHoiDong?: { TenDayDu?: string; TaiKhoan?: string };
  MocDeTai?: MocTienDo;
  TaiLieu?: Array<{ MaTL: number; TenFile: string }>;
  PhanHoi?: Array<{ Id: number; KetQua: string; NhanXet: string; NgayPhanHoi: string; NguoiHoiDong?: { TenDayDu?: string; TaiKhoan?: string } }>;
}
export interface TaoBaoCaoDto {
  LoaiBaoCao: LoaiBaoCao;
  MaMoc?: number;
  KyBaoCao?: string;
  NoiDungBaoCao: string;
  TienDoBaoCao?: number;
  KhoKhan?: string;
  DeXuat?: string;
}
export interface CapNhatBaoCaoDto {
  NoiDungBaoCao?: string;
  TienDoBaoCao?: number;
  KhoKhan?: string;
  DeXuat?: string;
}
export interface DeTaiTheoDoi { MaDT: string; MaHoiDong?: number; TenDT: string; ChuNhiem: string; Khoa: string; TienDo: number; TrangThai: string; TenHoiDong?: string; NghiepVuHoiDong?: string; VaiTroTrongHoiDong?: string; ThanhVienHoiDong?: Array<{ TaiKhoan: string; TenDayDu: string; ChucDanh: string }> }

export const getMocTienDoByTopic = async (maDT: string): Promise<MocTienDo[]> =>
  (await ApiAxios.get('/progress/getprogress', { params: { MaDT: maDT } })).data;
export const getTopicProgress = async (maDT: string): Promise<TopicProgress> => {
  const [deTai, mocTienDo] = await Promise.all([ApiAxios.get(`/project/${maDT}`), getMocTienDoByTopic(maDT)]);
  return { MaDT: maDT, TenDT: deTai.data.TenDT, PhanTramTongThe: deTai.data.TienDo, MocTienDo: mocTienDo };
};
export const createMocTienDo = async (moc: TaoTienDo) => (await ApiAxios.post('/progress/createprogress', moc)).data;
export const updateMocTienDo = async (id: number, moc: CapNhatTienDo) => (await ApiAxios.patch(`/progress/updateprogress/${id}`, moc)).data;
export const deleteMocTienDo = async (id: number) => { await ApiAxios.delete(`/progress/deleteprogress/${id}`); };
export const getMemberById = async (maMoc: number): Promise<ThanhVienMocDT[]> => (await ApiAxios.get(`/progress/member/${maMoc}`)).data;

export const getBaoCaoTheoDeTai = async (maDT: string): Promise<BaoCaoTienDo[]> =>
  (await ApiAxios.get(`/progress-reports/project/${maDT}`)).data;
export const taoBaoCaoTienDo = async (maDT: string, dto: TaoBaoCaoDto): Promise<BaoCaoTienDo> =>
  (await ApiAxios.post(`/progress-reports/project/${maDT}`, dto)).data;
export const capNhatBaoCaoTienDo = async (id: number, dto: CapNhatBaoCaoDto): Promise<BaoCaoTienDo> =>
  (await ApiAxios.patch(`/progress-reports/${id}`, dto)).data;
export const xoaBaoCaoTienDo = async (id: number) => {
  await ApiAxios.delete(`/progress-reports/${id}`);
};
export const guiBaoCaoTienDo = async (id: number): Promise<BaoCaoTienDo> =>
  (await ApiAxios.post(`/progress-reports/${id}/submit`)).data;
export const nhanXetBaoCao = async (id: number, note: string, decision?: 'accepted' | 'supplement' | 'rejected') =>
  (await ApiAxios.post(`/progress-reports/${id}/review`, { decision, note })).data;
export const chotKetLuanBaoCao = async (id: number, decision: KetLuanBaoCao, note: string) =>
  (await ApiAxios.post(`/progress-reports/${id}/finalize`, { decision, note })).data;
export const getDeTaiDuocGan = async (): Promise<DeTaiTheoDoi[]> =>
  (await ApiAxios.get('/progress-reports/monitoring/projects')).data;
export const getDeTaiTheoHoiDong = async (): Promise<DeTaiTheoDoi[]> =>
  (await ApiAxios.get('/progress-reports/council/projects')).data;
export const getCouncilMembership = async (): Promise<{ isCouncilMember: boolean }> =>
  (await ApiAxios.get('/progress-reports/council/me')).data;

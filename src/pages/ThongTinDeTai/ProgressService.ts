import ApiAxios from '../../axios.config';

export interface MocTienDo {
  MaMoc: number; MaDT: string; TenMoc: string; MoTa?: string; ThuTu: number;
  TrongSo: number; GhiChu?: string; TrangThai: string; NgayBatDau: Date; NgayKetThuc: Date;
}
export interface TaoTienDo extends Omit<MocTienDo, 'MaMoc'> { ThanhVienIds?: number[] }
export interface CapNhatTienDo { TenMoc?: string; MoTa?: string; NgayCapNhat: Date; ThuTu?: number; TrongSo?: number; GhiChu?: string; NgayBatDau?: Date; NgayKetThuc?: Date; ThanhVienIds?: number[] }
export interface TopicProgress { MaDT: string; TenDT: string; PhanTramTongThe: number; MocTienDo: MocTienDo[] }
export interface ThanhVienMocDT { Id: number; thanhVien: { idTV: number; VaiTroDT: string; NguoiDung: { TaiKhoan: string; TenDayDu: string; VaiTro: string } } }

export type TrangThaiBaoCao = 'Nháp' | 'Đã gửi' | 'Yêu cầu bổ sung' | 'Đạt' | 'Không đạt';
export interface BaoCaoTienDo {
  Id: number; MaDT: string; MaMoc: number; KyBaoCao: string; NoiDungBaoCao: string;
  TienDoBaoCao?: number; KhoKhan?: string; DeXuat?: string; TaiKhoanNguoiGui: string;
  TrangThai: TrangThaiBaoCao; NhanXetHoiDong?: string; NgayGui?: string;
  MocDeTai?: MocTienDo; TaiLieu?: Array<{ MaTL: number; TenFile: string }>;
}
export interface TaoBaoCaoDto { MaMoc: number; NoiDungBaoCao: string; TienDoBaoCao?: number; KhoKhan?: string; DeXuat?: string }
export interface DeTaiTheoDoi { MaDT: string; TenDT: string; ChuNhiem: string; Khoa: string; TienDo: number; TrangThai: string }

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
export const guiBaoCaoTienDo = async (id: number): Promise<BaoCaoTienDo> =>
  (await ApiAxios.post(`/progress-reports/${id}/submit`)).data;
export const nhanXetBaoCao = async (id: number, decision: 'accepted' | 'supplement' | 'rejected', note: string) =>
  (await ApiAxios.post(`/progress-reports/${id}/review`, { decision, note })).data;
export const getDeTaiDuocGan = async (): Promise<DeTaiTheoDoi[]> =>
  (await ApiAxios.get('/progress-reports/monitoring/projects')).data;

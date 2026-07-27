// src/pages/ThongTinDeTai/ProgressService.ts
import ApiAxios from "../../axios.config";

/* Kiểu dữ liệu cho Mốc Tiến Độ */
export interface MocTienDo {
  MaMoc: number;
  MaDT: string;
  TenMoc: string;
  MoTa: string;
  ThuTu: number;
  TrongSo: number;
  GhiChu?: string;
  TrangThai: string;
  NgayBatDau: Date;
  NgayKetThuc: Date;
  NgayTao: Date;
  NgayCapNhat?: Date;
}

/* Kiểu dữ liệu cho Tạo Tiến Độ */
export interface TaoTienDo {
  MaDT: string;
  TenMoc: string;
  MoTa?: string;
  ThuTu: number;
  TrongSo: number;
  GhiChu?: string;
  TrangThai: string;
  NgayBatDau: Date;
  NgayKetThuc: Date;
  ThanhVienIds?: number[];
}

/* Kiểu dữ liệu cho Cập Nhật Tiến Độ */
export interface CapNhatTienDo {
  TenMoc?: string;
  MoTa?: string;
  NgayCapNhat: Date;
  ThuTu?: number;
  TrongSo?: number;
  GhiChu?: string;
  NgayBatDau?: Date;
  NgayKetThuc?: Date;
  ThanhVienIds?: number[];
}

/* Kiểu dữ liệu tổng hợp cho đề tài với tiến độ */
export interface TopicProgress {
  MaDT: string;
  TenDT: string;
  PhanTramTongThe: number;
  MocTienDo: MocTienDo[];
}

export interface NguoiDung {
  TaiKhoan: string;
  TenDayDu: string;
  VaiTro: string;
}

export interface ThanhVienDT {
  idTV: string;
  VaiTroDT: string
  NguoiDung: NguoiDung;
}

export interface ThanhVienMocDT {
  Id: number;
  thanhVien: ThanhVienDT;
}

/* ===== Báo cáo tiến độ ===== */

export interface BaoCaoTienDo {
  Id: number;
  MaDT: string;
  KyBaoCao: string;
  NoiDungBaoCao: string;
  TienDoBaoCao: number;
  KhoKhan?: string;
  DeXuat?: string;
  TaiKhoanNguoiGui: string;
  NgayGui: string;
  TrangThaiDuyet: 'ChoDuyet' | 'Dat' | 'YeuCauBoSung' | 'CanDieuChinh' | 'KhongDat';
  NhanXetHoiDong?: string;
  TenFile?: string;
  MaTL?: number;
}

export interface GuiBaoCaoDto {
  MaDT: string;
  KyBaoCao: string;
  NoiDungBaoCao: string;
  TienDoBaoCao: number;
  KhoKhan?: string;
  DeXuat?: string;
  MaMoc?: number;           // thêm — mốc tiến độ liên quan
  TaiLieuIds?: number[];    // thêm — các file minh chứng của mốc muốn đính kèm báo cáo
}

export interface NhanXetBaoCaoDto {
  TrangThaiDuyet: BaoCaoTienDo['TrangThaiDuyet'];
  NhanXetHoiDong: string;
}

/* ===== Đề tài (dành cho hội đồng theo dõi) ===== */

export interface DeTaiTheoDoi {
  MaDT: string;
  TenDT: string;
  ChuNhiem: string;
  Khoa: string;
  TienDo: number;
  TrangThai: 'DangThucHien' | 'ChoNghiemThu' | 'ChoThanhLy' | 'DaThanhLy' | 'HoanThanh';
}

/* ===== API Functions - Mốc tiến độ ===== */

export const getMocTienDoByTopic = async (maDT: string): Promise<MocTienDo[]> => {
  const res = await ApiAxios.get("/progress/getprogress", {
    params: { MaDT: maDT },
  });
  return res.data;
};

export const getTopicProgress = async (maDT: string): Promise<TopicProgress> => {
  const [deTai, mocTienDo] = await Promise.all([
    ApiAxios.get(`/project/${maDT}`),
    getMocTienDoByTopic(maDT),
  ]);

  return {
    MaDT: maDT,
    TenDT: deTai.data.TenDT,
    PhanTramTongThe: deTai.data.TienDo,
    MocTienDo: mocTienDo,
  };
};

export const createMocTienDo = async (moc: TaoTienDo): Promise<MocTienDo> => {
  const response = await ApiAxios.post('/progress/createprogress', moc);
  return response.data;
};

export const updateMocTienDo = async (id: number, moc: CapNhatTienDo): Promise<MocTienDo> => {
  const res = await ApiAxios.patch(`/progress/updateprogress/${id}`, moc);
  return res.data;
};

export const deleteMocTienDo = async (id: number): Promise<void> => {
  await ApiAxios.delete(`/progress/deleteprogress/${id}`);
};

export const getMemberById = async (maMoc: number): Promise<ThanhVienMocDT[]> => {
  const res = await ApiAxios.get(`/progress/member/${maMoc}`);
  return res.data;
};

/* ===== API Functions - Đề tài được gán (hội đồng theo dõi) ===== */

export const getDeTaiDuocGan = async (): Promise<DeTaiTheoDoi[]> => {
  const { data } = await ApiAxios.get<DeTaiTheoDoi[]>('/hoi-dong-theo-doi/de-tai-duoc-gan');
  return data;
};

/* ===== API Functions - Báo cáo tiến độ ===== */

export const guiBaoCaoTienDo = async (
  dto: GuiBaoCaoDto,
  file?: File | null,
): Promise<BaoCaoTienDo> => {
  const formData = new FormData();
  formData.append('MaDT', dto.MaDT);
  formData.append('KyBaoCao', dto.KyBaoCao);
  formData.append('NoiDungBaoCao', dto.NoiDungBaoCao);
  formData.append('TienDoBaoCao', String(dto.TienDoBaoCao));
  if (dto.KhoKhan) formData.append('KhoKhan', dto.KhoKhan);
  if (dto.DeXuat) formData.append('DeXuat', dto.DeXuat);
  if (dto.MaMoc) formData.append('MaMoc', String(dto.MaMoc));
  if (dto.TaiLieuIds?.length) formData.append('TaiLieuIds', JSON.stringify(dto.TaiLieuIds));
  if (file) formData.append('File', file);

  const { data } = await ApiAxios.post<BaoCaoTienDo>('/bao-cao-tien-do', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export const getBaoCaoTheoDeTai = async (maDT: string): Promise<BaoCaoTienDo[]> => {
  const { data } = await ApiAxios.get<BaoCaoTienDo[]>(`/bao-cao-tien-do/de-tai/${maDT}`);
  return data;
};

export const nhanXetBaoCao = async (
  id: number,
  dto: NhanXetBaoCaoDto,
): Promise<BaoCaoTienDo> => {
  const { data } = await ApiAxios.patch<BaoCaoTienDo>(`/bao-cao-tien-do/${id}/nhan-xet`, dto);
  return data;
};

export const downloadBaoCaoFile = async (maTL: number, tenFile: string): Promise<void> => {
  const response = await ApiAxios.get(`/bao-cao-tien-do/${maTL}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = tenFile;
  link.click();
  window.URL.revokeObjectURL(url);
};
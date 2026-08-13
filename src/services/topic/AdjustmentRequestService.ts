import ApiAxios from '../../axios.config';

export type AdjustmentRequestStatus = 'Chờ duyệt' | 'Đã chấp nhận' | 'Từ chối';

export interface AdjustmentRequest {
  Id: number;
  MaDT: string;
  TaiKhoanNguoiGui: string;
  NhomDieuChinh: string;
  ThongTinHienTai: string;
  NoiDungDeNghi: string;
  LyDo: string;
  TrangThai: AdjustmentRequestStatus;
  LyDoTuChoi?: string;
  DaApDung?: boolean;
  NgayApDung?: string;
  NoiDungDaApDung?: string;
  NgayGui: string;
  NgayXuLy?: string;
  DeTai?: { TenDT?: string };
  NguoiGui?: { TaiKhoan?: string; TenDayDu?: string };
  NguoiXuLy?: { TaiKhoan?: string; TenDayDu?: string };
  TaiLieu?: Array<{ MaTL: number; TenFile: string }>;
}

export interface CreateAdjustmentRequestPayload {
  nhomDieuChinh: string[];
  thongTinHienTai: string;
  noiDungDeNghi: string;
  lyDo: string;
}

export const createAdjustmentRequest = async (
  maDT: string,
  payload: CreateAdjustmentRequestPayload,
): Promise<AdjustmentRequest> =>
  (await ApiAxios.post(`/adjustment-requests/project/${maDT}`, {
    NhomDieuChinh: payload.nhomDieuChinh,
    ThongTinHienTai: payload.thongTinHienTai,
    NoiDungDeNghi: payload.noiDungDeNghi,
    LyDo: payload.lyDo,
  })).data;

export const getAdminAdjustmentRequests = async (params?: {
  status?: AdjustmentRequestStatus;
  page?: number;
  limit?: number;
}): Promise<{ data: AdjustmentRequest[]; total: number; page: number; limit: number }> =>
  (await ApiAxios.get('/adjustment-requests/admin', { params })).data;

export const reviewAdjustmentRequest = async (
  id: number,
  decision: 'accepted' | 'rejected',
  reason?: string,
): Promise<AdjustmentRequest> =>
  (await ApiAxios.post(`/adjustment-requests/${id}/review`, { decision, reason })).data;

export interface ApplyAdjustmentPayload {
  ThongTinDeTai?: {
    TenDT?: string;
    ChuyenNganh?: string;
    Khoa?: string;
    PhanLoai?: string;
    MoTa?: string;
  };
  MoTa?: string;
  Milestones?: Array<{ MaMoc: number; NgayKetThuc: string }>;
  ThanhVien?: Array<{ TaiKhoan: string; VaiTroDT: string }>;
  GhiChuApDung?: string;
}

export const applyAdjustmentRequest = async (
  id: number,
  payload: ApplyAdjustmentPayload,
): Promise<AdjustmentRequest> =>
  (await ApiAxios.post(`/adjustment-requests/${id}/apply`, payload)).data;

export const deleteAdjustmentRequest = async (id: number): Promise<void> => {
  await ApiAxios.delete(`/adjustment-requests/${id}`);
};

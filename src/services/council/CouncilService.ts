import ApiAxios from '../../axios.config';

export type CouncilBusiness = 'approval' | 'scoring' | 'monitoring' | 'liquidation' | 'other';
export type CouncilPosition = 'Chủ tịch' | 'Thư ký' | 'Ủy viên' | 'Phản biện';
export type CouncilRequestStatus = 'Chờ duyệt' | 'Đã chấp nhận' | 'Từ chối';

export interface CouncilType {
  MaLoaiHoiDong: number;
  TenLoaiHoiDong: string;
  NghiepVu: CouncilBusiness;
  MoTa?: string;
  ThoiGianHop?: string;       // ISO datetime string
  HinhThucHop?: CouncilMeetingType;
  DiaDiem?: string;           // dùng khi HinhThucHop === 'offline'
  LinkHop?: string;           // dùng khi HinhThucHop === 'online'
}

export type CouncilMeetingType = 'online' | 'offline';

export interface CouncilMember {
  Id: number;
  TaiKhoan: string;
  ChucDanh: CouncilPosition;
  NguoiDung?: { TaiKhoan: string; TenDayDu?: string; VaiTro?: string };
}

export interface Council {
  MaHoiDong: number;
  TenHoiDong: string;
  MaLoaiHoiDong: number;
  MoTa?: string;
  NgayTao?: string;
  LoaiHoiDong?: CouncilType;
  ThanhVienHoiDong?: CouncilMember[];
}

export interface CouncilAssignmentRequest {
  Id: number;
  MaDT: string;
  MaBaoCaoTienDo?: number;
  MaLoaiHoiDong: number;
  MaHoiDong?: number;
  TaiKhoanNguoiGui: string;
  TaiKhoanNguoiXuLy?: string;
  NgayGui: string;
  TrangThai: CouncilRequestStatus;
  LyDoYeuCau?: string;
  LyDoTuChoi?: string;
  YeuCauGocId?: number;
  NgayXuLy?: string;
  DeTai?: { MaDT: string; TenDT?: string; TrangThai?: string };
  LoaiHoiDong?: CouncilType;
  HoiDong?: Council;
  NguoiGui?: { TaiKhoan: string; TenDayDu?: string };
  NguoiXuLy?: { TaiKhoan: string; TenDayDu?: string };
}

export interface CreateCouncilAssignmentRequestPayload {
  MaLoaiHoiDong: number;
  LyDoYeuCau?: string;
}

export const getCouncilTypes = async (): Promise<CouncilType[]> =>
  (await ApiAxios.get('/admin/councils/types')).data;

export const getAvailableCouncilTypes = async (): Promise<CouncilType[]> =>
  (await ApiAxios.get('/council-requests/types')).data;

export const createCouncilType = async (
  payload: Pick<CouncilType, 'TenLoaiHoiDong'> &
    Partial<Pick<CouncilType, 'NghiepVu' | 'MoTa' | 'ThoiGianHop' | 'HinhThucHop' | 'DiaDiem' | 'LinkHop'>>,
) => (await ApiAxios.post('/admin/councils/types', payload)).data;

export const getCouncils = async (typeId?: number): Promise<Council[]> =>
  (await ApiAxios.get('/admin/councils', { params: { typeId } })).data;

export const getCouncilDetail = async (id: number): Promise<Council> =>
  (await ApiAxios.get(`/admin/councils/${id}`)).data;

export const createCouncil = async (payload: Pick<Council, 'TenHoiDong' | 'MaLoaiHoiDong'> & Partial<Pick<Council, 'MoTa'>>) =>
  (await ApiAxios.post('/admin/councils', payload)).data;

export const updateCouncil = async (id: number, payload: Partial<Pick<Council, 'TenHoiDong' | 'MaLoaiHoiDong' | 'MoTa'>>) =>
  (await ApiAxios.patch(`/admin/councils/${id}`, payload)).data;

export const deleteCouncil = async (id: number) =>
  (await ApiAxios.delete(`/admin/councils/${id}`)).data;

export const searchAccounts = async (keyword: string) => {
  const response = await ApiAxios.get('/admin/councils/eligible-members', { params: { keyword } });
  return response.data as Array<{ TaiKhoan: string; TenDayDu?: string; VaiTro?: string }>;
};

export const addCouncilMember = async (councilId: number, TaiKhoan: string, ChucDanh: CouncilPosition) =>
  (await ApiAxios.post(`/admin/councils/${councilId}/members`, { TaiKhoan, ChucDanh })).data;

export const removeCouncilMember = async (councilId: number, TaiKhoan: string) =>
  (await ApiAxios.delete(`/admin/councils/${councilId}/members/${TaiKhoan}`)).data;

export const assignCouncilToTopic = async (maDT: string, MaHoiDong: number) =>
  (await ApiAxios.post(`/admin/councils/projects/${maDT}`, { MaHoiDong })).data;

export const getCouncilRequests = async (status?: CouncilRequestStatus): Promise<CouncilAssignmentRequest[]> =>
  (await ApiAxios.get('/admin/councils/requests', { params: { status } })).data;

export const getMyCouncilRequests = async (): Promise<CouncilAssignmentRequest[]> =>
  (await ApiAxios.get('/council-requests/my')).data;

export const createCouncilAssignmentRequest = async (
  maDT: string,
  payload: CreateCouncilAssignmentRequestPayload,
): Promise<CouncilAssignmentRequest> =>
  (await ApiAxios.post(`/council-requests/projects/${maDT}`, payload)).data;

export const resubmitCouncilAssignmentRequest = async (
  id: number,
  payload: CreateCouncilAssignmentRequestPayload,
): Promise<CouncilAssignmentRequest> =>
  (await ApiAxios.post(`/council-requests/${id}/resubmit`, payload)).data;

export const approveCouncilRequest = async (id: number, MaHoiDong: number): Promise<CouncilAssignmentRequest> =>
  (await ApiAxios.patch(`/admin/councils/requests/${id}/approve`, { MaHoiDong })).data;

export const rejectCouncilRequest = async (id: number, LyDoTuChoi: string): Promise<CouncilAssignmentRequest> =>
  (await ApiAxios.patch(`/admin/councils/requests/${id}/reject`, { LyDoTuChoi })).data;

/* API cũ đã được thay bằng các endpoint phân công hội đồng theo từng đề tài. */
export const getLegacyCouncilRequests = async () =>
  (await ApiAxios.get('/admin/councils/requests')).data;


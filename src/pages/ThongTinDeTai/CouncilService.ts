import ApiAxios from '../../axios.config';

export type CouncilBusiness = 'approval' | 'scoring' | 'monitoring' | 'liquidation' | 'other';
export type CouncilPosition = 'Chủ tịch' | 'Thư ký' | 'Ủy viên' | 'Phản biện';

export interface CouncilType {
  MaLoaiHoiDong: number;
  TenLoaiHoiDong: string;
  NghiepVu: CouncilBusiness;
  MoTa?: string;
}

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
  NamBatDau: number;
  NamKetThuc: number;
  LoaiHoiDong?: CouncilType;
  ThanhVienHoiDong?: CouncilMember[];
}

export const getCouncilTypes = async (): Promise<CouncilType[]> =>
  (await ApiAxios.get('/admin/councils/types')).data;

export const createCouncilType = async (payload: Pick<CouncilType, 'TenLoaiHoiDong'> & Partial<Pick<CouncilType, 'NghiepVu' | 'MoTa'>>) =>
  (await ApiAxios.post('/admin/councils/types', payload)).data;

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
  const response = await ApiAxios.get('/admin/users', { params: { keyword, page: 1, limit: 20 } });
  return response.data.data as Array<{ TaiKhoan: string; TenDayDu?: string; VaiTro?: string }>;
};

export const addCouncilMember = async (councilId: number, TaiKhoan: string, ChucDanh: CouncilPosition) =>
  (await ApiAxios.post(`/admin/councils/${councilId}/members`, { TaiKhoan, ChucDanh })).data;

export const removeCouncilMember = async (councilId: number, TaiKhoan: string) =>
  (await ApiAxios.delete(`/admin/councils/${councilId}/members/${TaiKhoan}`)).data;

export const assignCouncilToTopic = async (maDT: string, MaHoiDong: number) =>
  (await ApiAxios.post(`/admin/councils/projects/${maDT}`, { MaHoiDong })).data;

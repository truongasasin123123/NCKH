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
  TrongSo: number; // % trọng số
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
  PhanTramTongThe: number; // % tổng thể tính theo trọng số các mốc đã "Hoàn thành"
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

// Đây là interface đại diện cho từng phần tử trong mảng trả về từ API /progress/member/:maMoc
export interface ThanhVienMocDT {
  id: number;
  thanhVien: ThanhVienDT;
}

/* API Functions */
export const getMocTienDoByTopic = async (maDT: string): Promise<MocTienDo[]> => {
  const res = await ApiAxios.get("/progress/getprogress", {
    params: {
      MaDT: maDT,
    },
  });

  return res.data;
};

// Lấy tiến độ tổng thể của đề tài
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

// Tạo mốc tiến độ mới
export const createMocTienDo = async (moc: TaoTienDo): Promise<MocTienDo> => {
  const response = await ApiAxios.post('/progress/createprogress', moc);
  return response.data;
};

// Cập nhật mốc tiến độ (chỉ Chủ nhiệm)
export const updateMocTienDo = async (id: number, moc: CapNhatTienDo): Promise<MocTienDo> => {
  const res = await ApiAxios.put(`/progress/updateprogress/${id}`, moc);
  return res.data;
};

// Xóa mốc tiến độ (chỉ Chủ nhiệm)
export const deleteMocTienDo = async (id: number): Promise<void> => {
  await ApiAxios.delete(`/progress/deleteprogress/${id}`);
};

export const getMemberById = async (maMoc: number): Promise<ThanhVienMocDT[]> => {
  const res = await ApiAxios.get(`/progress/member/${maMoc}`);
  return res.data;
}

// Upload file minh chứng
export const uploadMinhChung = async (file: File): Promise<string> => {
  // Mock response
  console.log('Mock file uploaded:', file.name);
  return `/files/mock_${file.name}`;
};
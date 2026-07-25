import ApiAxios from '../../axios.config';
export interface Council {
  MaHoiDong: string;
  TenHoiDong: string;
  LoaiHoiDong: string;

  MoTa: string;
}

export interface CouncilMember {
  MaThanhVien: string;
  TaiKhoan: string;
  HoTen: string;
  VaiTroHoiDong: "ChuTich" | "UyVien" | "ThuKy";
}

export const DEFAULT_COUNCILS: Council[] = [
  {
    MaHoiDong: "KHDT_Khoa",
    TenHoiDong: "Hội đồng Khoa học - Đào tạo Khoa",
    LoaiHoiDong: "KHDT_Khoa",
    MoTa: "Xét duyệt đề cương cấp cơ sở.",
  },
  {
    MaHoiDong: "XetChonThamDinh",
    TenHoiDong: "Hội đồng xét chọn / tuyển chọn / thẩm định",
    LoaiHoiDong: "XetChonThamDinh",
    MoTa: "Xét chọn danh mục, thẩm định đề tài trước khi phê duyệt.",
  },
  {
    MaHoiDong: "KiemTraGiamSat",
    TenHoiDong: "Hội đồng kiểm tra, giám sát",
    LoaiHoiDong: "KiemTraGiamSat",
    MoTa: "Theo dõi thực hiện đề tài và kiểm tra tiến độ.",
  },
  {
    MaHoiDong: "NghiemThu",
    TenHoiDong: "Hội đồng nghiệm thu",
    LoaiHoiDong: "NghiemThu",
    MoTa: "Đánh giá kết quả cuối cùng, chấm điểm và xếp loại.",
  },
  {
    MaHoiDong: "ThanhLy",
    TenHoiDong: "Hội đồng thanh lý",
    LoaiHoiDong: "ThanhLy",
    MoTa: "Xử lý đề tài không đạt, quá hạn hoặc có quyết định thanh lý.",
  },
  {
    MaHoiDong: "SVNCKH",
    TenHoiDong: "Hội đồng xét chọn công trình SVNCKH",
    LoaiHoiDong: "SVNCKH",
    MoTa: "Chọn công trình tham gia hội nghị/giải thưởng cấp Khoa hoặc Học viện.",
  },
];

export const getCouncils = async (): Promise<Council[]> => {
  const res = await ApiAxios.get("/councils");
  return res.data;
};

export const getCouncilDetail = async (maHoiDong: string) => {
  const res = await ApiAxios.get(`/councils/${maHoiDong}`);
  return res.data;
};

export const createCouncil = async (payload: Partial<Council>) => {
  const res = await ApiAxios.post("/councils", payload);
  return res.data;
};

export const searchAccounts = async (keyword: string) => {
  const res = await ApiAxios.get(`/users/search?keyword=${keyword}`);
  return res.data;
};

export const getCouncilMembers = async (maHoiDong: string): Promise<CouncilMember[]> => {
  const res = await ApiAxios.get(`/councils/${maHoiDong}/members`);
  return res.data;
};

export const addCouncilMember = async (maHoiDong: string, taiKhoan: string, vaiTro: string) => {
  const res = await ApiAxios.post(`/councils/${maHoiDong}/members`, { TaiKhoan: taiKhoan, VaiTroHoiDong: vaiTro });
  return res.data;
};

export const removeCouncilMember = async (maHoiDong: string, maThanhVien: string) => {
  const res = await ApiAxios.delete(`/councils/${maHoiDong}/members/${maThanhVien}`);
  return res.data;
};

export const assignCouncilToTopic = async (maDT: string, maHoiDong: string) => {
  const res = await ApiAxios.post(`/topics/${maDT}/assign-council`, { MaHoiDong: maHoiDong });
  return res.data;
};
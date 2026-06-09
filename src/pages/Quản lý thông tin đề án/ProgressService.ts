// import ApiAxios from "../../axios.config";;

/* Kiểu dữ liệu cho Mốc Tiến Độ */
export interface MocTienDo {
  MaMoc: string;
  MaDT: string;
  TenMoc: string;
  MoTa: string;
  NgayBatDau: Date;
  NgayKetThuc: Date;
  ThuTu: number;
  TrongSo: number; // % trọng số
  TrangThai: "Chưa bắt đầu" | "Đang thực hiện" | "Hoàn thành" | "Trễ hạn" | "Sắp hạn";
}

/* Kiểu dữ liệu cho Cập Nhật Tiến Độ */
export interface CapNhatTienDo {
  MaCapNhat: string;
  MaMoc: string;
  TaiKhoan: string;
  NgayCapNhat: Date;
  PhanTramHT: number; // % hoàn thành
  GhiChu: string;
  TepDinhKem?: string; // URL hoặc path file
}

/* Kiểu dữ liệu tổng hợp cho đề tài với tiến độ */
export interface TopicProgress {
  MaDT: string;
  TenDT: string;
  PhanTramTongThe: number; // % tổng thể tính theo trọng số
  MocTienDo: MocTienDo[];
  CapNhatTienDo: CapNhatTienDo[];
}

/* API Functions */

// Lấy danh sách mốc tiến độ của một đề tài
export const getMocTienDoByTopic = async (maDT: string): Promise<MocTienDo[]> => {
  // Mock data
  return [
    {
      MaMoc: "MOC001",
      MaDT: maDT,
      TenMoc: "Khảo sát thực địa",
      MoTa: "Thu thập dữ liệu tại các điểm khảo sát",
      NgayBatDau: new Date("2026-01-01"),
      NgayKetThuc: new Date("2026-01-31"),
      ThuTu: 1,
      TrongSo: 20,
      TrangThai: "Hoàn thành"
    },
    {
      MaMoc: "MOC002",
      MaDT: maDT,
      TenMoc: "Phân tích dữ liệu",
      MoTa: "Xử lý và phân tích dữ liệu thu thập được",
      NgayBatDau: new Date("2026-02-01"),
      NgayKetThuc: new Date("2026-02-28"),
      ThuTu: 2,
      TrongSo: 30,
      TrangThai: "Đang thực hiện"
    },
    {
      MaMoc: "MOC003",
      MaDT: maDT,
      TenMoc: "Viết báo cáo giữa kỳ",
      MoTa: "Soạn thảo báo cáo tiến độ giữa kỳ",
      NgayBatDau: new Date("2026-03-01"),
      NgayKetThuc: new Date("2026-03-15"),
      ThuTu: 3,
      TrongSo: 25,
      TrangThai: "Sắp hạn"
    },
    {
      MaMoc: "MOC004",
      MaDT: maDT,
      TenMoc: "Báo cáo cuối kỳ",
      MoTa: "Hoàn thiện báo cáo cuối cùng",
      NgayBatDau: new Date("2026-04-01"),
      NgayKetThuc: new Date("2026-04-30"),
      ThuTu: 4,
      TrongSo: 25,
      TrangThai: "Chưa bắt đầu"
    }
  ];
};

// Lấy lịch sử cập nhật tiến độ của một mốc
export const getCapNhatTienDoByMoc = async (maMoc: string): Promise<CapNhatTienDo[]> => {
  // Mock data
  const mockData: Record<string, CapNhatTienDo[]> = {
    "MOC001": [
      {
        MaCapNhat: "CN001",
        MaMoc: "MOC001",
        TaiKhoan: "user1",
        NgayCapNhat: new Date("2026-01-15"),
        PhanTramHT: 50,
        GhiChu: "Hoàn thành khảo sát tại 3 điểm",
        TepDinhKem: "/files/khaosat_1.pdf"
      },
      {
        MaCapNhat: "CN002",
        MaMoc: "MOC001",
        TaiKhoan: "user1",
        NgayCapNhat: new Date("2026-01-25"),
        PhanTramHT: 100,
        GhiChu: "Hoàn thành tất cả khảo sát",
        TepDinhKem: "/files/khaosat_final.pdf"
      }
    ],
    "MOC002": [
      {
        MaCapNhat: "CN003",
        MaMoc: "MOC002",
        TaiKhoan: "user2",
        NgayCapNhat: new Date("2026-02-10"),
        PhanTramHT: 30,
        GhiChu: "Đã nhập liệu 30% dữ liệu",
        TepDinhKem: "/files/data_30.xlsx"
      },
      {
        MaCapNhat: "CN004",
        MaMoc: "MOC002",
        TaiKhoan: "user2",
        NgayCapNhat: new Date("2026-02-20"),
        PhanTramHT: 60,
        GhiChu: "Hoàn thành phân tích sơ bộ",
        TepDinhKem: "/files/analysis_60.pdf"
      }
    ],
    "MOC003": [
      {
        MaCapNhat: "CN005",
        MaMoc: "MOC003",
        TaiKhoan: "user1",
        NgayCapNhat: new Date("2026-03-05"),
        PhanTramHT: 0,
        GhiChu: "Bắt đầu viết báo cáo",
        TepDinhKem: undefined
      }
    ],
    "MOC004": [],
  };

  return mockData[maMoc] || [];
};

// Lấy tiến độ tổng thể của đề tài
export const getTopicProgress = async (maDT: string): Promise<TopicProgress> => {
  // Mock data
  const mocTienDo = await getMocTienDoByTopic(maDT);
  const capNhatTienDo: CapNhatTienDo[] = [];

  // Thu thập tất cả cập nhật từ các mốc
  for (const moc of mocTienDo) {
    const updates = await getCapNhatTienDoByMoc(moc.MaMoc);
    capNhatTienDo.push(...updates);
  }

  // Tính % tổng thể theo trọng số
  let tongTrongSo = 0;
  let tongDiem = 0;

  for (const moc of mocTienDo) {
    const latestUpdate = capNhatTienDo
      .filter(c => c.MaMoc === moc.MaMoc)
      .sort((a, b) => new Date(b.NgayCapNhat).getTime() - new Date(a.NgayCapNhat).getTime())[0];

    const isCompleted = latestUpdate?.PhanTramHT === 100 || moc.TrangThai === 'Hoàn thành';
    if (isCompleted) {
      tongDiem += moc.TrongSo;
    }
    tongTrongSo += moc.TrongSo;
  }

  const phanTramTongThe = tongTrongSo > 0 ? Math.min((tongDiem / tongTrongSo) * 100, 100) : 0;

  return {
    MaDT: maDT,
    TenDT: "Đề tài Nghiên cứu Công nghệ AI trong Nông nghiệp",
    PhanTramTongThe: Math.round(phanTramTongThe * 100) / 100,
    MocTienDo: mocTienDo,
    CapNhatTienDo: capNhatTienDo
  };
};

// Tạo mốc tiến độ mới (chỉ Chủ nhiệm)
export const createMocTienDo = async (moc: Omit<MocTienDo, 'MaMoc'>): Promise<MocTienDo> => {
  // Mock response
  const newMoc: MocTienDo = {
    ...moc,
    MaMoc: `MOC${Date.now()}`, // Generate mock ID
  };
  console.log('Mock created:', newMoc);
  return newMoc;
};

// Cập nhật mốc tiến độ (chỉ Chủ nhiệm)
export const updateMocTienDo = async (maMoc: string, moc: Partial<MocTienDo>): Promise<MocTienDo> => {
  // Mock response
  console.log('Mock updated:', maMoc, moc);
  return {
    MaMoc: maMoc,
    MaDT: moc.MaDT || '',
    TenMoc: moc.TenMoc || '',
    MoTa: moc.MoTa || '',
    NgayBatDau: moc.NgayBatDau || new Date(),
    NgayKetThuc: moc.NgayKetThuc || new Date(),
    ThuTu: moc.ThuTu || 0,
    TrongSo: moc.TrongSo || 0,
    TrangThai: moc.TrangThai || 'Chưa bắt đầu'
  };
};

// Xóa mốc tiến độ (chỉ Chủ nhiệm)
export const deleteMocTienDo = async (maMoc: string): Promise<void> => {
  // Mock response
  console.log('Mock deleted:', maMoc);
};

// Cập nhật % hoàn thành mốc (Chủ nhiệm và Thành viên)
export const updateProgress = async (capNhat: Omit<CapNhatTienDo, 'MaCapNhat'>): Promise<CapNhatTienDo> => {
  // Mock response
  const newCapNhat: CapNhatTienDo = {
    ...capNhat,
    MaCapNhat: `CN${Date.now()}`, // Generate mock ID
  };
  console.log('Mock progress updated:', newCapNhat);
  return newCapNhat;
};

// Upload file minh chứng
export const uploadMinhChung = async (file: File): Promise<string> => {
  // Mock response
  console.log('Mock file uploaded:', file.name);
  return `/files/mock_${file.name}`;
};
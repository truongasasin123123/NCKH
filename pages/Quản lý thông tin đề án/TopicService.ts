import ApiAxios from "../../axios.config"


/* Kiểu dữ liệu */
export interface TopicLoad {
    MaDT: string
    TenDT: string
    PhanLoai: string
    TrangThai: string
    NgayBatDau: Date
    NgayKetThuc: Date
    NgayTao: Date
    MoTa: string
    TongKinhPhi: number
    
    ThanhVienDT: ThanhVienDT[];
}

export interface ThanhVienDT {
    TaiKhoan: string
    VaiTroDT: string
}

/* Connect API */
export const getMyTopics = async (): Promise<TopicLoad[]> => {
    const res = await ApiAxios.get("/project/getproject");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.data;
};

export const getTopicById = async (id: String): Promise<TopicLoad> => {
    const res = await ApiAxios.get(`/project/${id}`);
    return res.data;
}

export const getMemberByid = async (id: string): Promise<ThanhVienDT[]> => {
    const res = await ApiAxios.get(`/project/member/${id}`);
    return res.data;
}

export const getPendingTopics = async (state: string): Promise<TopicLoad[]> => {
    const res = await ApiAxios.get(`/project/state/${state}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.data;
};

export const getUsersByRole = async (role: string) => {
    const res = await ApiAxios.get(`/user/roleuser/${role}`);
    return res.data;
};

export const getApprovedTopics = async (): Promise<TopicLoad[]> => {
    const res = await ApiAxios.get("/project/approved");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.data;
};
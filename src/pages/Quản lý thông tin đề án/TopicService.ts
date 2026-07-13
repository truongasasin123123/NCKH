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
    progress?: number

    ThanhVienDT: ThanhVienDT[];
}

export interface ThanhVienDT {
    idTV: number
    TaiKhoan: string
    VaiTroDT: string

    NguoiDung: NguoiDung;
}

export interface NguoiDung{
    TenDayDu: string
    VaiTro: string
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

export const getLeaderByid = async (id: string): Promise<ThanhVienDT> => {
    const res = await ApiAxios.get(`/project/leader/${id}`);
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

export const changeProjectState = async (id: string, state: string) => {
    const response = await ApiAxios.patch(`/project/changestate/${id}`, {
        state: state
    });
    return response.data;
}

export const deleteProject = async (id: string) => {
    const res = await ApiAxios.delete(`/project/deleteproject/${id}`);
    return res.data;
}

export const updateProjectDate = async (id: string, dates: {
    NgayBatDau?: string;
    NgayKetThuc?: string;
    NgayXetDuyet?: string;
}) => {
    const response = await ApiAxios.patch(`/project/updatedate/${id}`, dates);
    return response.data;
};
import ApiAxios from "../../axios.config"


/* Kiểu dữ liệu */
export interface TopicLoad {
    MaDT: string
    TenDT: string
    PhanLoai: string
    ChuyenNganh?: string
    Khoa?: string
    TrangThai: string
    NgayBatDau: Date
    NgayKetThuc: Date
    NgayTao: Date
    MoTa: string
    TongKinhPhi: number
    progress?: number

    ThanhVienDT: ThanhVienDT[];
    NhomTruong?: {
        TaiKhoan: string;
        TenDayDu: string;
    } | null;
}

export interface AdminTopicListResponse {
    data: TopicLoad[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminTopicQuery {
    keyword?: string;
    phanLoai?: string;
    trangThai?: string;
    page?: number;
    limit?: number;
}

export interface ThanhVienDT {
    idTV: number
    TaiKhoan: string
    VaiTroDT: string

    NguoiDung: NguoiDung;
}

export interface NguoiDung {
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

export const getMemberByTopic = async (id: string): Promise<ThanhVienDT[]> => {
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

export const submitProjectForApproval = async (
    id: string,
    councilType: 'approval' | 'scoring',
    note?: string,
) => {
    const response = await ApiAxios.post(`/project/${id}/submit-for-approval`, { councilType, note });
    return response.data;
};

export const getProjectApprovals = async (id: string) => {
    const response = await ApiAxios.get(`/project/${id}/approvals`);
    return response.data;
};

export const getAdminTopics = async (
    params: AdminTopicQuery,
): Promise<AdminTopicListResponse> => {
    const response = await ApiAxios.get('/project/admin/all', { params });
    return response.data;
};

export const resendProjectApproval = async (
    id: string,
    reviewerAccount: string,
    note?: string,
) => {
    const response = await ApiAxios.post(
        `/project/${id}/approvals/${encodeURIComponent(reviewerAccount)}/resend`,
        { note },
    );
    return response.data;
};

export const getProjectApprovalHistory = async (id: string) => {
    const response = await ApiAxios.get(`/project/${id}/approval-history`);
    return response.data;
};

export const reviewProject = async (
    id: string,
    decision: 'approved' | 'rejected',
    note?: string,
) => {
    const response = await ApiAxios.post(`/project/${id}/review`, { decision, note });
    return response.data;
};

export const deleteProject = async (id: string) => {
    const res = await ApiAxios.delete(`/project/deleteproject/${id}`);
    return res.data;
}

export const updateProject = async (id: string, project: {
    TenDT?: string;
    ChuyenNganh?: string;
    Khoa?: string;
    PhanLoai?: string;
    idNguoiHD?: string;
    MoTa?: string;
}) => {
    const response = await ApiAxios.patch(`/project/updateproject/${id}`, project);
    return response.data;
};

export const updateProjectDate = async (id: string, dates: {
    NgayBatDau?: string;
    NgayKetThuc?: string;
    NgayXetDuyet?: string;
}) => {
    const response = await ApiAxios.patch(`/project/updatedate/${id}`, dates);
    return response.data;
};

/**
 * Tra cứu đề tài toàn hệ thống — dùng cho mọi role đã đăng nhập (chỉ xem, không sửa/xóa).
 * Khác với getAdminTopics (/project/admin/all — chỉ quantri), endpoint /project/search
 * cần được backend mở quyền cho mọi JWT hợp lệ, không áp RolesGuard.
 */
export interface TopicSearchQuery {
    keyword?: string;
    phanLoai?: string;
    khoa?: string;
    trangThai?: string;
    namHoc?: string;
    page?: number;
    limit?: number;
}

export const searchTopics = async (
    params: TopicSearchQuery,
): Promise<AdminTopicListResponse> => {
    const response = await ApiAxios.get('/project/search', { params });
    return response.data;
};

/**
 * Kiểm tra tài khoản hiện tại có đang là "Nhóm trưởng" ở ít nhất 1 đề tài không.
 * Tận dụng lại getMyTopics() (đã có ThanhVienDT kèm VaiTroDT) thay vì gọi thêm API riêng.
 */
export const checkIsTeamLeader = async (currentAccount?: string): Promise<boolean> => {
    if (!currentAccount) return false;
    const topics = await getMyTopics();
    return topics.some((topic) =>
        topic.ThanhVienDT?.some(
            (member) => member.TaiKhoan === currentAccount && member.VaiTroDT === 'Nhóm trưởng',
        ),
    );
};

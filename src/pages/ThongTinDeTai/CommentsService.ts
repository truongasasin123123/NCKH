import ApiAxios from '../../axios.config';

export interface ProjectComment {
  Id: number;
  MaDT: string;
  TaiKhoan: string;
  NoiDung: string;
  NgayTao: string;
  NgayCapNhat: string;
  NguoiDung?: {
    TaiKhoan: string;
    TenDayDu?: string;
    VaiTro?: string;
  };
}

export const getProjectComments = async (maDT: string): Promise<ProjectComment[]> => {
  const response = await ApiAxios.get(`/comments/project/${maDT}`);
  return response.data;
};

export const createProjectComment = async (maDT: string, NoiDung: string): Promise<ProjectComment> => {
  const response = await ApiAxios.post(`/comments/project/${maDT}`, { NoiDung });
  return response.data;
};

export const updateProjectComment = async (id: number, NoiDung: string): Promise<ProjectComment> => {
  const response = await ApiAxios.patch(`/comments/${id}`, { NoiDung });
  return response.data;
};

export const deleteProjectComment = async (id: number) => {
  await ApiAxios.delete(`/comments/${id}`);
};

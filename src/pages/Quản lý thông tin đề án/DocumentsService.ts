import ApiAxios from '../../axios.config';

export interface TaiLieu {
  MaTL: number;
  MaDT: string;
  MaMoc?: number;
  TenFile: string;
  NguoiGui: string;
  LoaiTaiLieu?: string;
  NgayTaiLen?: string;
}

interface UploadDocumentParams {
  file: File;
  maDT: string;
  maMoc?: number;
  loaiTaiLieu?: string;
}

export const uploadDocument = async ({
  file,
  maDT,
  maMoc,
  loaiTaiLieu,
}: UploadDocumentParams): Promise<TaiLieu> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('MaDT', maDT);
  if (maMoc !== undefined) formData.append('MaMoc', String(maMoc));
  if (loaiTaiLieu) formData.append('LoaiTaiLieu', loaiTaiLieu);

  const response = await ApiAxios.post('/documents/upload', formData);
  return response.data.data;
};

export const submitMilestone = async ({
  file,
  maDT,
  maMoc,
  loaiTaiLieu,
}: UploadDocumentParams): Promise<TaiLieu> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("MaDT", maDT);
  if (maMoc !== undefined) formData.append("MaMoc", String(maMoc));
  if (loaiTaiLieu) formData.append("LoaiTaiLieu", loaiTaiLieu);

  const response = await ApiAxios.post("/progress/submit", formData);
  return response.data.data;
};

export const getDocumentsByTopic = async (maDT: string): Promise<TaiLieu[]> => {
  const response = await ApiAxios.get(`/documents/detai/${maDT}`);
  return response.data;
};

export const deleteDocument = async (id: number) => {
  await ApiAxios.delete(`/documents/${id}`);
}

export const getDocumentsByMilestone = async (
  maMoc: number,
): Promise<TaiLieu[]> => {
  const response = await ApiAxios.get(`/documents/moc/${maMoc}`);
  return response.data;
};

const getFileName = (contentDisposition?: string, fallback = 'tai-lieu') => {
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) return decodeURIComponent(encodedName);
  return contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
};

const getDocumentBlob = async (id: number) => {
  const response = await ApiAxios.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
  return {
    blob: response.data as Blob,
    fileName: getFileName(response.headers['content-disposition']),
  };
};

export const downloadDocument = async (id: number, fallbackName?: string) => {
  const { blob, fileName } = await getDocumentBlob(id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackName || fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const previewDocument = async (id: number) => {
  const previewWindow = window.open('', '_blank');
  const { blob } = await getDocumentBlob(id);
  const url = URL.createObjectURL(blob);

  if (previewWindow) {
    previewWindow.location.href = url;
  } else {
    window.open(url, '_blank');
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

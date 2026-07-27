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
  maBaoCaoTienDo?: number;
  loaiTaiLieu?: string;
}

export const uploadDocument = async ({
  file,
  maDT,
  maMoc,
  maBaoCaoTienDo,
  loaiTaiLieu,
}: UploadDocumentParams): Promise<TaiLieu> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('MaDT', maDT);
  if (maMoc !== undefined) formData.append('MaMoc', String(maMoc));
  if (maBaoCaoTienDo !== undefined) formData.append('MaBaoCaoTienDo', String(maBaoCaoTienDo));
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

export const getDocumentsByProgressReport = async (reportId: number): Promise<TaiLieu[]> =>
  (await ApiAxios.get(`/documents/report/${reportId}`)).data;

const getFileName = (contentDisposition?: string, fallback = 'tai-lieu') => {
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encodedName) return decodeURIComponent(encodedName);
  return contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
};

const getMimeTypeFromFileName = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

const getDocumentBlob = async (id: number, mode: 'download' | 'preview' = 'download') => {
  const response = await ApiAxios.get(`/documents/${id}/${mode}`, {
    responseType: 'blob',
  });
  const fileName = getFileName(response.headers['content-disposition']);
  const responseContentType = response.headers['content-type']?.split(';')[0];
  const contentType = !responseContentType || responseContentType === 'application/octet-stream'
    ? getMimeTypeFromFileName(fileName)
    : responseContentType;
  return {
    blob: new Blob([response.data], { type: contentType }),
    fileName,
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
  try {
    const { blob, fileName } = await getDocumentBlob(id, 'preview');
    const url = URL.createObjectURL(blob);

    if (previewWindow) {
      const previewContent = blob.type.startsWith('image/')
        ? `<img src="${url}" alt="${fileName}" style="max-width:100%;height:auto" />`
        : blob.type === 'application/pdf'
          ? `<iframe src="${url}" title="${fileName}" style="width:100%;height:100vh;border:0"></iframe>`
          : '<p style="padding:16px">Trình duyệt không hỗ trợ xem trực tiếp định dạng này. Hãy dùng nút “Tải xuống”.</p>';

      previewWindow.document.open();
      previewWindow.document.write(`<!doctype html><html><head><title>Xem tài liệu</title></head><body style="margin:0;font-family:Arial">${previewContent}</body></html>`);
      previewWindow.document.close();
    } else {
      window.open(url, '_blank');
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
};

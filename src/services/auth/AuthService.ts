import ApiAxios from '../../axios.config';

export const PROFILE_UPDATED_EVENT = 'profile_updated';

export const emitProfileUpdated = (detail?: { avatar?: string | null }) => {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail }));
};

/**
 * Trả về URL đầy đủ của ảnh đại diện phục vụ hiển thị.
 */
export const getAvatarUrl = (avatarPath?: string): string | undefined => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${baseUrl}${path}`;
};

/**
 * Tải lên ảnh đại diện mới.
 */
export const uploadAvatar = async (file: File): Promise<{ message: string; avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await ApiAxios.post<{ message: string; avatarUrl: string }>('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  emitProfileUpdated({ avatar: response.data.avatarUrl });
  return response.data;
};

/**
 * Gỡ bỏ ảnh đại diện.
 */
export const removeAvatar = async (): Promise<{ message: string }> => {
  const response = await ApiAxios.delete<{ message: string }>('/auth/avatar');
  emitProfileUpdated({ avatar: null });
  return response.data;
};

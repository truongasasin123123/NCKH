import { useCallback, useState } from 'react';
import { message } from 'antd';
import { getDocumentsByTopic } from '../../services/topic/DocumentsService';
import type { DocumentQueryParams } from '../../services/topic/DocumentsService';
import type { ProjectDocumentItem } from '../../components/topic-detail/types';

export function useTopicDocuments() {
    const [documents, setDocuments] = useState<ProjectDocumentItem[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async (maDT: string, query?: DocumentQueryParams) => {
        try {
            setLoading(true);
            const response = await getDocumentsByTopic(maDT, query);
            setDocuments(response.map((document) => ({
                id: document.MaTL,
                name: document.TenFile,
                source: document.LoaiTaiLieu || 'Tài liệu đề tài',
                date: document.NgayTaiLen
                    ? new Date(document.NgayTaiLen).toLocaleDateString('vi-VN')
                    : undefined,
            })));
        } catch (error) {
            console.error('Lỗi khi tải tài liệu đề tài:', error);
            message.error('Không thể tải tài liệu đề tài');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        documents,
        loading,
        refresh,
    };
}

import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
    createProjectComment,
    deleteProjectComment,
    getProjectComments,
    updateProjectComment,
} from '../../services/topic/CommentsService';
import type { ProjectComment } from '../../services/topic/CommentsService';

export function useTopicComments(maDT?: string) {
    const [comments, setComments] = useState<ProjectComment[]>([]);
    const [input, setInput] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');

    const refresh = useCallback(async () => {
        if (!maDT) return;

        try {
            setComments(await getProjectComments(maDT));
        } catch {
            message.error('Không tải được nhận xét');
        }
    }, [maDT]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const create = async () => {
        if (!maDT || !input.trim()) {
            message.warning('Vui lòng nhập nội dung nhận xét');
            return;
        }

        try {
            const comment = await createProjectComment(maDT, input);
            setComments((current) => [comment, ...current]);
            setInput('');
            message.success('Đã thêm nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể thêm nhận xét');
        }
    };

    const update = async (id: number) => {
        if (!editingContent.trim()) {
            message.warning('Nội dung nhận xét không được để trống');
            return;
        }

        try {
            const comment = await updateProjectComment(id, editingContent);
            setComments((current) => current.map((item) => item.Id === id ? comment : item));
            setEditingId(null);
            setEditingContent('');
            message.success('Đã sửa nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể sửa nhận xét');
        }
    };

    const remove = async (id: number) => {
        try {
            await deleteProjectComment(id);
            setComments((current) => current.filter((comment) => comment.Id !== id));
            message.success('Đã xóa nhận xét');
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không thể xóa nhận xét');
        }
    };

    return {
        comments,
        input,
        setInput,
        editingId,
        setEditingId,
        editingContent,
        setEditingContent,
        refresh,
        create,
        update,
        remove,
    };
}

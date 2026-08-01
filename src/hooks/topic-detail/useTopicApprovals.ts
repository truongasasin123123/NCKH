import { useCallback, useState } from 'react';
import {
    getProjectApprovalHistory,
    getProjectApprovals,
} from '../../services/topic/TopicService';
import type { ReviewerApproval } from '../../components/topic-detail/types';

type CouncilType = 'Xét duyệt' | 'Chấm điểm';

function mapApproval(approval: {
    TaiKhoanHoiDong: string;
    TrangThai: string;
    NgayPhanHoi?: string;
    GhiChu?: string;
    NguoiDung?: { TenDayDu?: string };
    LoaiHoiDong?: CouncilType;
}): ReviewerApproval {
    return {
        account: approval.TaiKhoanHoiDong,
        name: approval.NguoiDung?.TenDayDu || approval.TaiKhoanHoiDong,
        status: approval.TrangThai,
        responseDate: approval.NgayPhanHoi,
        note: approval.GhiChu,
        councilType: approval.LoaiHoiDong || 'Xét duyệt',
    };
}

export function useTopicApprovals(maDT?: string) {
    const [approvalStatus, setApprovalStatus] = useState<ReviewerApproval[]>([]);
    const [approvalHistory, setApprovalHistory] = useState<ReviewerApproval[]>([]);
    const [submittedCouncilTypes, setSubmittedCouncilTypes] = useState<CouncilType[]>([]);

    const refreshStatus = useCallback(async () => {
        if (!maDT) return;

        try {
            const approvals = await getProjectApprovals(maDT);
            setSubmittedCouncilTypes(Array.from(new Set(
                approvals.map((approval: { LoaiHoiDong?: CouncilType }) => approval.LoaiHoiDong || 'Xét duyệt'),
            )) as CouncilType[]);
            setApprovalStatus(approvals.map(mapApproval));
        } catch (error) {
            console.error('Lỗi khi tải trạng thái xét duyệt:', error);
        }
    }, [maDT]);

    const refreshHistory = useCallback(async () => {
        if (!maDT) return;

        try {
            const history = await getProjectApprovalHistory(maDT);
            setApprovalHistory(history.map(mapApproval));
        } catch (error) {
            console.error('Lỗi khi tải lịch sử xét duyệt:', error);
        }
    }, [maDT]);

    const refresh = useCallback(async () => {
        await Promise.all([refreshStatus(), refreshHistory()]);
    }, [refreshHistory, refreshStatus]);

    return {
        approvalStatus,
        approvalHistory,
        submittedCouncilTypes,
        setApprovalStatus,
        setSubmittedCouncilTypes,
        refreshStatus,
        refreshHistory,
        refresh,
    };
}

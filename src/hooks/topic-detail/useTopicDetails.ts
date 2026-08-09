import { useCallback, useState } from 'react';
import {
    getMemberByTopic,
    getTopicById,
} from '../../services/topic/TopicService';
import type {
    ThanhVienDT,
    TopicLoad,
} from '../../services/topic/TopicService';
import { getAcceptanceByProject } from '../../services/topic/AcceptanceService';
import type { HoSoNghiemThu } from '../../services/topic/AcceptanceService';

export function useTopicDetails() {
    const [topic, setTopic] = useState<TopicLoad | null>(null);
    const [members, setMembers] = useState<ThanhVienDT[]>([]);
  const [acceptanceDossier, setAcceptanceDossier] = useState<HoSoNghiemThu | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAcceptanceDossier = useCallback(async (maDT: string) => {
    try {
      const dossiers = await getAcceptanceByProject(maDT);
      setAcceptanceDossier(dossiers[0] || null);
    } catch (error) {
      // Đề tài cũ chưa có hồ sơ nghiệm thu vẫn phải mở được trang chi tiết.
      console.warn('Chưa tải được hồ sơ nghiệm thu:', error);
      setAcceptanceDossier(null);
    }
  }, []);

  const load = useCallback(async (maDT: string) => {
        setLoading(true);

        try {
            const [project, projectMembers] = await Promise.all([
                getTopicById(maDT),
                getMemberByTopic(maDT),
            ]);

            if (!project) {
                setTopic(null);
                setMembers([]);
                setAcceptanceDossier(null);
                return null;
            }

            setTopic(project);
            setMembers(projectMembers);

            await refreshAcceptanceDossier(maDT);

            return project;
        } finally {
            setLoading(false);
        }
    }, [refreshAcceptanceDossier]);

    return {
        topic,
        setTopic,
        members,
        acceptanceDossier,
        loading,
        load,
        refreshAcceptanceDossier,
    };
}

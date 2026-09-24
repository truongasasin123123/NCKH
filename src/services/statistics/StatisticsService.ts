import ApiAxios from '../../axios.config';

// ===== Types =====

export type TopicStatus = 'in_progress' | 'completed' | 'overdue';

export type CouncilTopicStatus = 'pending' | 'approved' | 'rejected';

export interface StatisticsOverview {
  totalTopics: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface OverdueTopic {
  id: string;
  topicName: string;
  owner: string;
  daysOverdue: number;
}

export interface DepartmentStat {
  departmentName: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface BudgetStat {
  totalBudget: number;
  disbursed: number;
}

export interface AdminStatisticsResponse {
  overview: StatisticsOverview;
  overdueTopics: OverdueTopic[];
  byDepartment: DepartmentStat[];
  monthlyTrend: MonthlyTrend[];
  budget: BudgetStat;
}

export interface Milestone {
  name: string;
  status: 'completed' | 'in_progress' | 'upcoming' | 'not_started';
  deadline?: string;
}

export interface OwnerTopic {
  id: string;
  topicName: string;
  status: TopicStatus;
  milestones: Milestone[];
  nextDeadline: string | null;
}

export interface TodoItem {
  id: string;
  content: string;
  level: 'overdue' | 'upcoming';
  days: number;
}

export interface OwnerStatisticsResponse {
  todoItems: TodoItem[];
  myTopics: OwnerTopic[];
}

export interface StatisticsQueryParams {
  academicYear?: string;
  departmentId?: string;
  status?: string;
}

export type ExportFormat = 'excel' | 'pdf' | 'docx';


export interface CouncilTopic {
  id: string;
  topicName: string;
  status: CouncilTopicStatus;
  councilTypeName: string;   // loại hội đồng (Xét duyệt, Nghiệm thu...)
  submittedDate: string;
  processedDate: string | null;
}

export interface CouncilStatisticsOverview {
  totalTopics: number;
  pending: number;
  approved: number;
}

export interface CouncilStatisticsResponse {
  overview: CouncilStatisticsOverview;
  topics: CouncilTopic[];
}

export const getCouncilStatistics = async (): Promise<CouncilStatisticsResponse> => {
  const res = await ApiAxios.get('/statistics/council');
  return res.data;
};

export const exportCouncilTopicsReport = async (format: ExportFormat): Promise<void> => {
  const res = await ApiAxios.get('/statistics/council/export', {
    params: { format },
    responseType: 'blob',
  });
  const extensionMap: Record<ExportFormat, string> = { excel: 'xlsx', pdf: 'pdf', docx: 'docx' };
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `thong-ke-de-tai-hoi-dong.${extensionMap[format]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ===== API calls =====

export const getAdminOverview = async (
  params: StatisticsQueryParams,
): Promise<AdminStatisticsResponse> => {
  const res = await ApiAxios.get('/statistics/overview', { params });
  return res.data;
};

export const getMyStatistics = async (): Promise<OwnerStatisticsResponse> => {
  const res = await ApiAxios.get('/statistics/my-topics');
  return res.data;
};

export const exportMyTopicsReport = async (format: ExportFormat): Promise<void> => {
  const res = await ApiAxios.get('/statistics/my-topics/export', {
    params: { format },
    responseType: 'blob',
  });
  const extensionMap: Record<ExportFormat, string> = { excel: 'xlsx', pdf: 'pdf', docx: 'docx' };
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `thong-ke-de-tai-cua-toi.${extensionMap[format]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportReport = async (
  format: ExportFormat,
  params: StatisticsQueryParams,
): Promise<void> => {
  const res = await ApiAxios.get('/statistics/export', {
    params: { ...params, format },
    responseType: 'blob',
  });

  const extensionMap: Record<ExportFormat, string> = {
    excel: 'xlsx',
    pdf: 'pdf',
    docx: 'docx',
  };

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `thong-ke-de-tai.${extensionMap[format]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

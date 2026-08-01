export interface ReviewerApproval {
  account: string;
  name: string;
  status: string;
  responseDate?: string;
  note?: string;
  councilType: 'Xét duyệt' | 'Chấm điểm';
}

export interface ProjectDocumentItem {
  id: number;
  name: string;
  source: string;
  date?: string;
}

import { useState, useEffect, useMemo } from 'react';
import { Form, message, Modal } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { getMemberByTopic, getMyTopics } from '../../services/topic/TopicService';
import type { ThanhVienDT, TopicLoad } from '../../services/topic/TopicService';
import {
  deleteDocument, downloadDocument, getDocumentsByMilestone, submitMilestone, uploadDocument,
} from '../../services/topic/DocumentsService';
import type { TaiLieu } from '../../services/topic/DocumentsService';
import {
  getTopicProgress, createMocTienDo, updateMocTienDo, deleteMocTienDo, getMemberById,
  capNhatBaoCaoTienDo, getBaoCaoTheoDeTai, guiBaoCaoTienDo, taoBaoCaoTienDo, xoaBaoCaoTienDo, getDeTaiDuocGan, yeuCauHoiDongNghiemThuTungPhan,
} from '../../services/progress/ProgressService';
import type { MocTienDo, CapNhatTienDo, ThanhVienMocDT, BaoCaoTienDo, LoaiBaoCao } from '../../services/progress/ProgressService';

interface JwtPayload {
  VaiTro?: string;
  TaiKhoan?: string;
}

/**
 * Hook quản lý toàn bộ dữ liệu và nghiệp vụ của trang Quản lý tiến độ đề tài.
 * Chịu trách nhiệm: gọi API, quản lý state, xử lý logic nghiệp vụ.
 * Không chứa JSX — phần giao diện nằm ở pages/ProgressManagement.tsx.
 */
export const useProgressManagement = () => {
  const { maDT } = useParams<{ maDT: string }>();
  const navigate = useNavigate();

  const [selectedTopicId, setSelectedTopicId] = useState<string>(maDT || '');
  const [pendingTopicId, setPendingTopicId] = useState<string>(maDT || '');
  const [topicKeyword, setTopicKeyword] = useState('');
  const [topics, setTopics] = useState<TopicLoad[]>([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const maDTToUse = selectedTopicId || maDT;
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [members, setMembers] = useState<ThanhVienDT[]>([]);
  const [milestoneMembers, setMilestoneMembers] = useState<ThanhVienMocDT[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thanhViens, setThanhViens] = useState<ThanhVienMocDT[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal states
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedMoc, setSelectedMoc] = useState<MocTienDo | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [viewForm] = Form.useForm();
  const [mocDocuments, setMocDocuments] = useState<TaiLieu[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showTopicSearch, setShowTopicSearch] = useState(!maDT);
  const [searchText, setSearchText] = useState('');
  const [baoCaoList, setBaoCaoList] = useState<BaoCaoTienDo[]>([]);
  const [baoCaoLoading, setBaoCaoLoading] = useState(false);
  const [isBaoCaoModalVisible, setIsBaoCaoModalVisible] = useState(false);
  const [baoCaoForm] = Form.useForm();
  const [submittingBaoCao, setSubmittingBaoCao] = useState(false);
  const [baoCaoFiles, setBaoCaoFiles] = useState<File[]>([]);
  const [editingBaoCao, setEditingBaoCao] = useState<BaoCaoTienDo | null>(null);
  const [loaiBaoCao, setLoaiBaoCao] = useState<LoaiBaoCao>('Theo mốc');

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const isCommitteeRole = (user?.VaiTro || '').toLowerCase().includes('hội đồng')
    || (user?.VaiTro || '').toLowerCase().includes('hoidong');

  useEffect(() => {
    if (isCommitteeRole && ['baocao', 'nghiem-thu-tung-phan'].includes(activeTab)) {
      setActiveTab('timeline');
    }
  }, [isCommitteeRole, activeTab]);

  const handleTopicChange = async (newMaDT: string) => {
    setPendingTopicId(newMaDT);
    setTopicKeyword(topics.find((topic) => topic.MaDT === newMaDT)?.TenDT || '');
    setMilestoneMembers([]);
    editForm.resetFields(['ThanhVienIds']);

    try {
      const data = await getMemberByTopic(newMaDT);
      setMembers(data);
    } catch (err) {
      console.error('Lỗi lấy thành viên đề tài:', err);
      setMembers([]);
    }
  };

  const handleTopicKeywordChange = (value: string) => {
    setTopicKeyword(value);
    if (!topics.some((topic) => topic.TenDT === value)) {
      setPendingTopicId('');
    }
  };

  const handleGoToTopic = () => {
    const nextTopicId = pendingTopicId || selectedTopicId;
    if (!nextTopicId) return;

    setSelectedTopicId(nextTopicId);
    navigate(`/mainhome/progress/${nextTopicId}`);
  };

  const fetchBaoCao = async () => {
    if (!maDTToUse) return;
    setBaoCaoLoading(true);
    try {
      const data = await getBaoCaoTheoDeTai(maDTToUse);
      setBaoCaoList(data);
    } catch {
      message.error('Không tải được danh sách báo cáo');
    } finally {
      setBaoCaoLoading(false);
    }
  };

  useEffect(() => {
    if (['baocao', 'nghiem-thu-tung-phan'].includes(activeTab) && maDTToUse) {
      fetchBaoCao();
    }
  }, [activeTab, maDTToUse]);

  const resetBaoCaoModal = () => {
    baoCaoForm.resetFields();
    setBaoCaoFiles([]);
    setEditingBaoCao(null);
    setLoaiBaoCao('Theo mốc');
  };

  const handleLuuBaoCao = async (values: any) => {
    if (!maDTToUse) return;
    let reportCreated = false;
    try {
      setSubmittingBaoCao(true);
      const report = editingBaoCao
        ? await capNhatBaoCaoTienDo(editingBaoCao.Id, values)
        : await taoBaoCaoTienDo(maDTToUse, {
          LoaiBaoCao: values.LoaiBaoCao,
          MaMoc: ['Theo mốc', 'Nghiệm thu từng phần'].includes(values.LoaiBaoCao) ? values.MaMoc : undefined,
          KyBaoCao: ['Theo mốc', 'Nghiệm thu từng phần'].includes(values.LoaiBaoCao) ? undefined : values.KyBaoCao,
          NoiDungBaoCao: values.NoiDungBaoCao,
          TienDoBaoCao: values.TienDoBaoCao,
          KhoKhan: values.KhoKhan,
          DeXuat: values.DeXuat,
        });
      reportCreated = true;
      await Promise.all(baoCaoFiles.map((file) => uploadDocument({
        file,
        maDT: maDTToUse,
        maBaoCaoTienDo: report.Id,
        loaiTaiLieu: 'Tài liệu tiến độ',
      })));
      message.success(editingBaoCao ? 'Đã cập nhật báo cáo nháp' : 'Đã tạo báo cáo ở trạng thái Nháp');
      resetBaoCaoModal();
      setIsBaoCaoModalVisible(false);
      await fetchBaoCao();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gửi báo cáo thất bại');
      // Nếu tạo báo cáo thất bại (chưa tạo được), xóa file đã chọn để tránh tồn đọng
      if (!reportCreated) {
        setBaoCaoFiles([]);
      }
    } finally {
      setSubmittingBaoCao(false);
    }
  };

  const handleSubmitExistingReport = async (reportId: number) => {
    try {
      setSubmittingBaoCao(true);
      await guiBaoCaoTienDo(reportId);
      message.success('Đã gửi báo cáo tiến độ');
      await fetchBaoCao();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể gửi báo cáo');
    } finally {
      setSubmittingBaoCao(false);
    }
  };

  const handleRequestPartialAcceptanceCouncil = async (reportId: number) => {
    try {
      setSubmittingBaoCao(true);
      await yeuCauHoiDongNghiemThuTungPhan(reportId);
      message.success('Đã gửi yêu cầu phân công Hội đồng nghiệm thu đến Admin');
      await fetchBaoCao();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể gửi yêu cầu Hội đồng');
    } finally {
      setSubmittingBaoCao(false);
    }
  };

  const handleOpenCreateBaoCao = (type: LoaiBaoCao = 'Theo mốc') => {
    resetBaoCaoModal();
    setLoaiBaoCao(type);
    baoCaoForm.setFieldValue('LoaiBaoCao', type);
    setIsBaoCaoModalVisible(true);
  };

  const handleEditBaoCao = (report: BaoCaoTienDo) => {
    setEditingBaoCao(report);
    setLoaiBaoCao(report.LoaiBaoCao);
    setBaoCaoFiles([]);
    baoCaoForm.setFieldsValue({
      LoaiBaoCao: report.LoaiBaoCao, MaMoc: report.MaMoc, KyBaoCao: report.KyBaoCao,
      NoiDungBaoCao: report.NoiDungBaoCao, TienDoBaoCao: report.TienDoBaoCao,
      KhoKhan: report.KhoKhan, DeXuat: report.DeXuat,
    });
    setIsBaoCaoModalVisible(true);
  };

  const handleDeleteBaoCao = (report: BaoCaoTienDo) => {
    Modal.confirm({
      title: 'Xóa báo cáo?', content: 'Báo cáo nháp và toàn bộ tài liệu minh chứng sẽ bị xóa.', okText: 'Xóa', okButtonProps: { danger: true },
      onOk: async () => { await xoaBaoCaoTienDo(report.Id); message.success('Đã xóa báo cáo'); await fetchBaoCao(); },
    });
  };

  const handleDeleteBaoCaoDocument = async (documentId: number) => {
    try { await deleteDocument(documentId); message.success('Đã xóa tài liệu'); await fetchBaoCao(); }
    catch (error: any) { message.error(error.response?.data?.message || 'Không thể xóa tài liệu'); }
  };

  useEffect(() => {
    if (maDTToUse) {
      fetchProgressData();
    }
  }, [maDTToUse]);

  useEffect(() => {
    if (maDT) {
      setSelectedTopicId(maDT);
      setPendingTopicId(maDT);
    }
  }, [maDT]);

  useEffect(() => {
    fetchTopicList();
  }, []);

  useEffect(() => {
    if (!isViewModalVisible || !selectedMoc) {
      setMocDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setDocumentsLoading(true);
        setMocDocuments(await getDocumentsByMilestone(selectedMoc.MaMoc));
      } catch (error) {
        console.error('Lỗi khi tải tài liệu mốc:', error);
        message.error('Không thể tải tài liệu minh chứng');
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [isViewModalVisible, selectedMoc]);

  const fetchTopicList = async () => {
    setTopicLoading(true);
    try {
      if (isCommitteeRole) {
        const assigned = await getDeTaiDuocGan();
        setTopics(assigned.map((topic) => ({
          MaDT: topic.MaDT,
          TenDT: topic.TenDT,
          PhanLoai: '',
          TrangThai: topic.TrangThai,
          NgayBatDau: new Date(),
          NgayKetThuc: new Date(),
          NgayTao: new Date(),
          MoTa: '',
          TongKinhPhi: 0,
          ThanhVienDT: [],
        })));
      } else {
        const myTopics = await getMyTopics();
        // API /project/getproject trả về bản ghi thành viên có đề tài nằm trong
        // trường DeTai. Chuẩn hóa về TopicLoad để giao diện luôn có MaDT/TenDT.
        setTopics(myTopics.map((item) => {
          const nestedTopic = (item as TopicLoad & { DeTai?: TopicLoad }).DeTai;
          return nestedTopic ? { ...nestedTopic, ThanhVienDT: nestedTopic.ThanhVienDT || [] } : item;
        }));
      }
    } catch (error) {
      message.error('Lỗi khi tải danh sách đề tài');
    } finally {
      setTopicLoading(false);
    }
  };

  const fetchProgressData = async () => {
    if (!maDTToUse) return;
    setLoading(true);
    try {
      const data = await getTopicProgress(maDTToUse);
      setProgressData(data);
      try {
        const mem = await getMemberByTopic(maDTToUse);
        setMembers(mem);
      } catch (e) {
        console.error('Không lấy được danh sách thành viên:', e);
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu tiến độ');
    } finally {
      setLoading(false);
    }
  };

  const normalizeRole = (role?: string) =>
    (role || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const currentMember = members.find(
    (member) => member.TaiKhoan === user?.TaiKhoan,
  );
  const canManageMoc = normalizeRole(currentMember?.VaiTroDT).includes('nhom truong');
  const memberOptions = useMemo(
    () => members.map((member) => ({
      label: `${member.NguoiDung.TenDayDu} (${member.VaiTroDT})`,
      value: member.idTV,
    })),
    [members],
  );

  const loadMilestoneMembers = async (maMoc: number, setEditSelection = false) => {
    try {
      setLoadingMembers(true);
      const data = await getMemberById(maMoc);
      setMilestoneMembers(data);
      setThanhViens(data);

      if (setEditSelection) {
        editForm.setFieldValue(
          'ThanhVienIds',
          data.map((item) => item.thanhVien.idTV),
        );
      }
    } catch (error) {
      console.error('Lỗi lấy thành viên của mốc:', error);
      message.error('Không thể tải thành viên của mốc');
      setMilestoneMembers([]);
      setThanhViens([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateMoc = () => {
    createForm.resetFields();
    setIsCreateModalVisible(true);
  };

  const handleEditMoc = (moc: MocTienDo) => {
    setSelectedMoc(moc);
    setSelectedFile(null);

    editForm.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      GhiChu: moc.GhiChu,
    });

    setIsEditModalVisible(true);
    void loadMilestoneMembers(moc.MaMoc, true);
  };

  const handleOpenUploadModal = (moc: MocTienDo) => {
    if (moc.TrangThai === 'Trễ hạn') {
      message.warning('Mốc này không thể nộp tài liệu, hãy liên hệ trưởng nhóm để có thể nộp file.');
      return;
    }

    setSelectedMoc(moc);
    setSelectedFile(null);
    setIsUploadModalVisible(true);
  };

  const handleSubmitFile = async () => {
    if (!selectedFile) {
      message.warning('Vui lòng chọn file!');
      return;
    }

    if (!selectedMoc) {
      message.warning('Không tìm thấy mốc tiến độ!');
      return;
    }

    try {
      setLoading(true);

      const result = await submitMilestone({
        file: selectedFile,
        maDT: String(maDTToUse),
        maMoc: selectedMoc.MaMoc,
        loaiTaiLieu: 'Tài liệu tiến độ',
      });

      message.success('Nộp tài liệu thành công!');
      console.log(result);

      setSelectedFile(null);
      createForm.resetFields();

      setIsUploadModalVisible(false);
      fetchProgressData();
    } catch (error) {
      console.error(error);
      message.error('Nộp tài liệu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMoc = (moc: MocTienDo) => {
    setSelectedMoc(moc);

    viewForm.setFieldsValue({
      ...moc,
      NgayBatDau: dayjs(moc.NgayBatDau),
      NgayKetThuc: dayjs(moc.NgayKetThuc),
      GhiChu: moc.GhiChu,
    });
    setIsViewModalVisible(true);
    void loadMilestoneMembers(moc.MaMoc);
  };

  const handleDeleteMoc = async (moc: MocTienDo) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc muốn xóa mốc "${moc.TenMoc}"?`,
      onOk: async () => {
        try {
          await deleteMocTienDo(moc.MaMoc);
          message.success('Xóa mốc thành công');
          fetchProgressData();
        } catch (error) {
          message.error('Lỗi khi xóa mốc');
        }
      },
    });
  };

  const handleCreateMocSubmit = async (values: any) => {
    try {
      const newMoc = {
        ...values,
        MaDT: maDTToUse,
        TrangThai: 'Đang thực hiện',
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
      };
      await createMocTienDo(newMoc);
      message.success('Tạo mốc thành công');
      setIsCreateModalVisible(false);
      await handleReset();
      fetchProgressData();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tạo mốc';
      if (Array.isArray(errorMessage)) {
        message.error(errorMessage.join(', '));
      } else {
        message.error(errorMessage);
      }
    }
  };

  const handleSaveSubmit = async (values: any) => {
    if (!selectedMoc) return;

    try {
      const updatedMoc: CapNhatTienDo = {
        TenMoc: values.TenMoc,
        MoTa: values.MoTa,
        ThuTu: values.ThuTu,
        TrongSo: values.TrongSo,
        GhiChu: values.GhiChu,
        NgayBatDau: values.NgayBatDau.toDate(),
        NgayKetThuc: values.NgayKetThuc.toDate(),
        NgayCapNhat: new Date(),
        ThanhVienIds: values.ThanhVienIds,
      };

      await updateMocTienDo(selectedMoc.MaMoc, updatedMoc);

      if (selectedFile) {
        await submitMilestone({
          file: selectedFile,
          maDT: selectedMoc.MaDT || maDTToUse || '',
          maMoc: selectedMoc.MaMoc,
          loaiTaiLieu: 'Tài liệu tiến độ',
        });
      }

      message.success('Cập nhật mốc tiến độ thành công');

      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedFile(null);

      fetchProgressData();
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi cập nhật mốc tiến độ');
    }
  };

  const handleReset = () => {
    createForm.resetFields();
  };

  return {
    // dữ liệu chung
    maDT, maDTToUse, isCommitteeRole, canManageMoc, memberOptions,
    // đề tài
    selectedTopicId, pendingTopicId, topicKeyword, topics, topicLoading, showTopicSearch, setShowTopicSearch,
    handleTopicChange, handleTopicKeywordChange, handleGoToTopic,
    // tiến độ / mốc
    progressData, loading, searchText, setSearchText,
    // tabs
    activeTab, setActiveTab,
    // mốc: modal & form
    isCreateModalVisible, setIsCreateModalVisible,
    isEditModalVisible, setIsEditModalVisible,
    isViewModalVisible, setIsViewModalVisible,
    isUploadModalVisible, setIsUploadModalVisible,
    selectedMoc, createForm, editForm, viewForm,
    selectedFile, setSelectedFile,
    milestoneMembers, thanhViens, loadingMembers,
    mocDocuments, documentsLoading,
    handleCreateMoc, handleEditMoc, handleViewMoc, handleDeleteMoc,
    handleOpenUploadModal, handleSubmitFile,
    handleCreateMocSubmit, handleSaveSubmit, handleReset,
    // báo cáo tiến độ
    baoCaoList, baoCaoLoading, isBaoCaoModalVisible, setIsBaoCaoModalVisible,
    baoCaoForm, submittingBaoCao, baoCaoFiles, setBaoCaoFiles,
    editingBaoCao, loaiBaoCao, setLoaiBaoCao,
    resetBaoCaoModal, handleLuuBaoCao, handleSubmitExistingReport,
    handleRequestPartialAcceptanceCouncil,
    handleOpenCreateBaoCao, handleEditBaoCao, handleDeleteBaoCao, handleDeleteBaoCaoDocument,
    // tiện ích
    downloadDocument,
  };
};

export type UseProgressManagementReturn = ReturnType<typeof useProgressManagement>;

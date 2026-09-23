import React from 'react';
import { Layout, Card, Button, Space, Tabs, Select, Input } from 'antd';
import { CheckOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useProgressManagement } from '../hooks/progress-management/useProgressManagement';
import ProgressTimeline from '../components/progress-management/ProgressTimeline';
import ProgressTable from '../components/progress-management/ProgressTable';
import BaoCaoTab from '../components/progress-management/BaoCaoTab';
import CreateMocModal from '../components/progress-management/CreateMocModal';
import EditMocModal from '../components/progress-management/EditMocModal';
import ViewMocModal from '../components/progress-management/ViewMocModal';
import UploadMocModal from '../components/progress-management/UploadMocModal';
import BaoCaoModal from '../components/progress-management/BaoCaoModal';
import type { MocTienDo } from '../services/progress/ProgressService';

const { Content } = Layout;
const { TabPane } = Tabs;

/**
 * Trang Quản lý tiến độ đề tài — chỉ chịu trách nhiệm bố cục và ghép các
 * component giao diện dùng lại (components/progress/*). Toàn bộ dữ liệu
 * và nghiệp vụ nằm ở hooks/progress-management/useProgressManagement.ts.
 */
const ProgressManagement: React.FC = () => {
  const {
    isCommitteeRole, canManageMoc, memberOptions,
    selectedTopicId, pendingTopicId, topics, topicLoading, showTopicSearch, setShowTopicSearch,
    handleTopicChange, handleGoToTopic,
    progressData, loading, searchText, setSearchText,
    activeTab, setActiveTab,
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
    baoCaoList, baoCaoLoading, isBaoCaoModalVisible, setIsBaoCaoModalVisible,
    baoCaoForm, submittingBaoCao, baoCaoFiles, setBaoCaoFiles,
    editingBaoCao, loaiBaoCao, setLoaiBaoCao,
    resetBaoCaoModal, handleLuuBaoCao, handleSubmitExistingReport,
    handleRequestPartialAcceptanceCouncil,
    handleOpenCreateBaoCao, handleEditBaoCao, handleDeleteBaoCao, handleDeleteBaoCaoDocument,
    downloadDocument,
  } = useProgressManagement();
  const progressReports = baoCaoList.filter((report) => report.LoaiBaoCao !== 'Nghiệm thu từng phần');
  const partialAcceptanceReports = baoCaoList.filter((report) => report.LoaiBaoCao === 'Nghiệm thu từng phần');

  return (
    <Content style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <span>
              {isCommitteeRole ? 'Xem tiến độ đề tài:' : 'Quản lý tiến độ đề tài:'}
              {!showTopicSearch && (
                <>
                  {' '}
                  <strong>{progressData?.TenDT}</strong>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => setShowTopicSearch(true)}
                  />
                </>
              )}
            </span>

            {showTopicSearch && (
              <>
                <Select
                  showSearch
                  loading={topicLoading}
                  placeholder="Chọn đề tài..."
                  style={{ width: 300 }}
                  optionFilterProp="children"
                  value={pendingTopicId || selectedTopicId || undefined}
                  onChange={handleTopicChange}
                  filterOption={(input, option) =>
                    String(option?.children)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {topics.map((topic) => (
                    <Select.Option key={topic.MaDT} value={topic.MaDT}>
                      {topic.TenDT}
                    </Select.Option>
                  ))}
                </Select>

                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleGoToTopic();
                    setShowTopicSearch(false);

                  }}
                >
                  Tìm
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'table' && (
              <Space>
                <Input.Search
                  allowClear
                  placeholder="Tìm kiếm mốc..."
                  style={{ width: 250 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {canManageMoc && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMoc}>
                    Thêm mốc
                  </Button>
                )}
              </Space>
            )
          }
        >
          <TabPane tab="Timeline" key="timeline">
            <ProgressTimeline mocList={progressData?.MocTienDo} />
          </TabPane>

          <TabPane tab="Bảng" key="table">
            <ProgressTable
              mocList={progressData?.MocTienDo}
              searchText={searchText}
              loading={loading}
              isCommitteeRole={isCommitteeRole}
              canManageMoc={canManageMoc}
              onView={handleViewMoc}
              onEdit={handleEditMoc}
              onDelete={handleDeleteMoc}
              onUpload={handleOpenUploadModal}
            />
          </TabPane>

          {/* Ẩn hoàn toàn tab Báo cáo tiến độ với hội đồng */}
          {!isCommitteeRole && (
            <TabPane tab="Báo cáo tiến độ" key="baocao">
              <BaoCaoTab
                canManageMoc={canManageMoc}
                baoCaoList={progressReports}
                baoCaoLoading={baoCaoLoading}
                submittingBaoCao={submittingBaoCao}
                onOpenCreate={handleOpenCreateBaoCao}
                onEdit={handleEditBaoCao}
                onDelete={handleDeleteBaoCao}
                onDeleteDocument={handleDeleteBaoCaoDocument}
                onSubmitExisting={handleSubmitExistingReport}
                downloadDocument={downloadDocument}
              />
            </TabPane>
          )}

          {!isCommitteeRole && (
            <TabPane tab="Nghiệm thu từng phần" key="nghiem-thu-tung-phan">
              <BaoCaoTab
                canManageMoc={canManageMoc}
                baoCaoList={partialAcceptanceReports}
                baoCaoLoading={baoCaoLoading}
                submittingBaoCao={submittingBaoCao}
                onOpenCreate={() => handleOpenCreateBaoCao('Nghiệm thu từng phần')}
                onEdit={handleEditBaoCao}
                onDelete={handleDeleteBaoCao}
                onDeleteDocument={handleDeleteBaoCaoDocument}
                onSubmitExisting={handleSubmitExistingReport}
                onRequestCouncil={handleRequestPartialAcceptanceCouncil}
                downloadDocument={downloadDocument}
                partialAcceptance
              />
            </TabPane>
          )}
        </Tabs>
      </Card>

      <CreateMocModal
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        form={createForm}
        memberOptions={memberOptions}
        onFinish={handleCreateMocSubmit}
        onReset={handleReset}
        nextThuTu={
          progressData?.MocTienDo?.length
            ? Math.max(...progressData.MocTienDo.map((moc: MocTienDo) => moc.ThuTu)) + 1
            : 1
        }
      />

      <EditMocModal
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        form={editForm}
        selectedMoc={selectedMoc}
        canManageMoc={canManageMoc}
        memberOptions={memberOptions}
        loadingMembers={loadingMembers}
        milestoneMembers={milestoneMembers}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onFinish={handleSaveSubmit}
      />

      <ViewMocModal
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        form={viewForm}
        selectedMoc={selectedMoc}
        loadingMembers={loadingMembers}
        thanhViens={thanhViens}
        mocDocuments={mocDocuments}
        documentsLoading={documentsLoading}
        downloadDocument={downloadDocument}
      />

      <UploadMocModal
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setSelectedFile(null);
        }}
        selectedMoc={selectedMoc}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onSubmit={handleSubmitFile}
      />

      <BaoCaoModal
        open={isBaoCaoModalVisible}
        onCancel={() => {
          setIsBaoCaoModalVisible(false);
          resetBaoCaoModal();
        }}
        form={baoCaoForm}
        editingBaoCao={editingBaoCao}
        loaiBaoCao={loaiBaoCao}
        setLoaiBaoCao={setLoaiBaoCao}
        mocOptions={progressData?.MocTienDo}
        baoCaoList={baoCaoList}
        baoCaoFiles={baoCaoFiles}
        setBaoCaoFiles={setBaoCaoFiles}
        submittingBaoCao={submittingBaoCao}
        partialAcceptance={loaiBaoCao === 'Nghiệm thu từng phần'}
        onFinish={handleLuuBaoCao}
      />
    </Content>
  );
};

export default ProgressManagement;

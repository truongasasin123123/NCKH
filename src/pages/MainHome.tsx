import { Layout, Row, Col, Badge } from "antd";
import { Outlet, NavLink } from "react-router-dom";
import { UserOutlined, EditOutlined, BellOutlined, ProfileOutlined, FileOutlined, BarChartOutlined, TeamOutlined, UnorderedListOutlined, AuditOutlined, PieChartOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { getNotifications } from "./ThongTinDeTai/NotificationService";
import "../style/content.css";

const { Content } = Layout;

interface JwtPayload {
  VaiTro?: string;
}

const MainHome: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const displayRole = user?.VaiTro || null;
  const isCommitteeRole = displayRole?.toLowerCase().includes('hội đồng') || displayRole?.toLowerCase().includes('hoidong');
  const isAdmin = displayRole?.toLowerCase().includes('quantri') || displayRole?.toLowerCase().includes('quản trị');


  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();

      // đếm thông báo chưa đọc
      const count = data.filter(n => !n.TrangThai).length;

      setUnreadCount(count);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // kiểm tra thông báo mới mỗi 5s
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Content style={{ marginTop: 60 }}>
        <Row gutter={16}>
          <Col xs={24} md={4}>
            <ul className="item-sider">
              {!isAdmin && (
                <li>
                  <NavLink to="/mainhome" className="li-link">
                    <ProfileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Đề tài của tôi</span>
                  </NavLink>
                </li>
              )}

              <li>
                <NavLink to="/mainhome/profile" className="li-link">
                  <UserOutlined style={{ fontSize: 18, marginRight: 5 }} />
                  <span>Thông tin cá nhân</span>
                </NavLink>
              </li>

              {!isCommitteeRole && !isAdmin && (
                <li>
                  <NavLink to="/mainhome/registertopic" className="li-link">
                    <EditOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Đăng ký đề tài</span>
                  </NavLink>
                </li>
              )}

              <li>
                <NavLink to="/mainhome/notifications" className="li-link">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BellOutlined style={{ fontSize: 18 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>Thông báo</span>
                      <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f', textAlign: 'center' }} />
                    </div>
                  </div>
                </NavLink>
              </li>

              {isCommitteeRole && (
                <li>
                  <NavLink to="/mainhome/approvedtopics" className="li-link">
                    <FileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Đề tài đã phê duyệt</span>
                  </NavLink>
                </li>
              )}

              {!isAdmin && (
                <li>
                  <NavLink to="/mainhome/progress-demo" className="li-link">
                    <BarChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Quản lý tiến độ</span>
                  </NavLink>
                </li>
              )}

              {isAdmin && (
                <>
                  <li>
                    <NavLink to="/mainhome/admin/users" className="li-link">
                      <TeamOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý người dùng</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/mainhome/admin/topics" className="li-link">
                      <UnorderedListOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý đề tài</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/mainhome/admin/councils" className="li-link">
                      <AuditOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý hội đồng</span>
                    </NavLink>
                  </li>
                  
                  <li>
                    <NavLink to="/mainhome/admin/reports" className="li-link">
                      <PieChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Thống kê / báo cáo</span>
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </Col>

          <Col xs={24} md={20}>
            <Outlet />
          </Col>
        </Row>
      </Content>
    </>
  );
};

export default MainHome;
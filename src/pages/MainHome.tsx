import { Layout, Row, Col, Badge } from "antd";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { UserOutlined, EditOutlined, BellOutlined, ProfileOutlined, FileOutlined, BarChartOutlined, TeamOutlined, AuditOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { getNotifications } from "./ThongTinDeTai/NotificationService";
import "../style/content.css";

const { Content } = Layout;

interface JwtPayload {
  VaiTro?: string;
  DaHoanThienHoSo?: boolean;
}

const MainHome: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const location = useLocation();
  const displayRole = user?.VaiTro || null;
  const normalizedRole = (displayRole || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/\s/g, '');
  const isCommitteeRole = normalizedRole.includes('hoidong');
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'quantri';

  if (user?.DaHoanThienHoSo === false && location.pathname !== '/mainhome/profile') {
    return <Navigate to="/mainhome/profile" replace />;
  }

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
                <>
                  <li>
                    <NavLink to="/mainhome" className="li-link">
                      <ProfileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Đề tài của tôi</span>
                    </NavLink>
                  </li>
                  {!isCommitteeRole && (
                    <li>
                      <NavLink to="/mainhome/registertopic" className="li-link">
                        <EditOutlined style={{ fontSize: 18, marginRight: 5 }} />
                        <span>Đăng ký đề tài</span>
                      </NavLink>
                    </li>
                  )}
                </>
              )}
              <li>
                <NavLink
                  to="/mainhome/profile"
                  className="li-link"
                >
                  <UserOutlined style={{ fontSize: 18, marginRight: 5 }} />
                  <span>Thông tin cá nhân</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/mainhome/notifications"
                  className="li-link"
                >
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
                  <NavLink
                    to="/mainhome/approvedtopics"
                    className="li-link"
                  >
                    <FileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Đề tài đã phê duyệt</span>
                  </NavLink>
                </li>
              )}
              {isAdmin && (
                <>
                  <li>
                    <NavLink to="/mainhome/admin/users" className="li-link">
                      <TeamOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý tài khoản</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/mainhome/admin/councils" className="li-link">
                      <AuditOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý hội đồng</span>
                    </NavLink>
                  </li>
                </>
              )}
              {!isAdmin && !isCommitteeRole && (
                <li>
                  <NavLink to="/mainhome/progress-demo" className="li-link">
                    <BarChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Quản lý tiến độ</span>
                  </NavLink>
                </li>
              )}
              {(isCommitteeRole|| isAdmin) &&(
                <li>
                  <NavLink to="/mainhome/hoi-dong-theo-doi" className="li-link">
                    <BarChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Theo dõi tiến độ đề tài</span>
                  </NavLink>
                </li>
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

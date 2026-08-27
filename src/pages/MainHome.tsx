import { Layout, Row, Col, Badge } from "antd";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { UserOutlined, EditOutlined, BellOutlined, ProfileOutlined, FileOutlined, BarChartOutlined, TeamOutlined, AuditOutlined, PieChartOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { getNotifications } from "../services/notification/NotificationService";
import { getCouncilMembership } from '../services/progress/ProgressService';
import "../style/content.css";

const { Content } = Layout;

interface JwtPayload {
  VaiTro?: string;
  DaHoanThienHoSo?: boolean;
  TaiKhoan?: string; // TODO: xác nhận đúng tên claim tài khoản trong JWT của bạn (có thể là sub, username...)
}

const MainHome: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCouncilMember, setIsCouncilMember] = useState(false);

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
  const canAccessCouncil = isCommitteeRole || isCouncilMember;



  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      const count = data.filter(n => !n.TrangThai).length;
      setUnreadCount(count);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token || isAdmin) return;
    getCouncilMembership()
      .then((data) => setIsCouncilMember(data.isCouncilMember))
      .catch(() => setIsCouncilMember(false));
  }, [token, isAdmin]);

  if (user?.DaHoanThienHoSo === false && location.pathname !== '/mainhome/profile') {
    return <Navigate to="/mainhome/profile" replace />;
  }
  if (isAdmin && location.pathname === '/mainhome') {
    return <Navigate to="/mainhome/admin/topics" replace />;
  }
  return (
    <>
      <Content style={{ marginTop: 60 }}>
        <Row gutter={16}>
          <Col xs={24} md={4}>
            <ul className="item-sider">
              {!isAdmin && !canAccessCouncil && (
                <>
                  <li>
                    <NavLink to="/mainhome" className="li-link">
                      <ProfileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Đề tài của tôi</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/mainhome/registertopic" className="li-link">
                      <EditOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Đăng ký đề tài</span>
                    </NavLink>
                  </li>
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
              {(isAdmin || !isCommitteeRole) && (
                <li>
                  <NavLink to="/mainhome/statistics" className="li-link">
                    <PieChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Thống kê</span>
                  </NavLink>
                </li>
              )}
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
                  <li>
                    <NavLink to="/mainhome/admin/topics" className="li-link">
                      <FileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                      <span>Quản lý đề tài</span>
                    </NavLink>
                  </li>
                </>
              )}
              {(!isAdmin || canAccessCouncil) && (
                <li>
                  <NavLink to="/mainhome/progress-demo" className="li-link">
                    <BarChartOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Quản lý tiến độ</span>
                  </NavLink>
                </li>
              )}
              
                
              
              {canAccessCouncil && (
                <li>
                  <NavLink to="/mainhome/approvedtopics" className="li-link">
                    <FileOutlined style={{ fontSize: 18, marginRight: 5 }} />
                    <span>Đề tài hội đồng</span>
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

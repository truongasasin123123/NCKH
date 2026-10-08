import { Layout, Row, Col, Badge, Dropdown, Button } from "antd";
import { Navigate, Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  EditOutlined,
  BellOutlined,
  ProfileOutlined,
  FileOutlined,
  BarChartOutlined,
  TeamOutlined,
  AuditOutlined,
  PieChartOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { getNotifications, NOTIFICATIONS_CHANGED_EVENT } from "../services/notification/NotificationService";
import { getCouncilMembership } from '../services/progress/ProgressService';
import "../style/content.css";

const { Content } = Layout;

interface JwtPayload {
  VaiTro?: string;
  DaHoanThienHoSo?: boolean;
  TaiKhoan?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const MainHome: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCouncilMember, setIsCouncilMember] = useState(false);

  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user: JwtPayload | null = token ? jwtDecode<JwtPayload>(token) : null;
  const location = useLocation();
  const navigate = useNavigate();
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
    const refreshUnreadCount = () => { void fetchUnreadCount(); };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshUnreadCount);
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshUnreadCount);
      clearInterval(interval);
    };
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

  // Danh sách các chức năng theo quyền người dùng
  const navItems: NavItem[] = [];

  if (!isAdmin && !canAccessCouncil) {
    navItems.push(
      { path: '/mainhome', label: 'Đề tài của tôi', icon: <ProfileOutlined style={{ fontSize: 18 }} /> },
      { path: '/mainhome/registertopic', label: 'Đăng ký đề tài', icon: <EditOutlined style={{ fontSize: 18 }} /> },
    );
  }

  navItems.push({
    path: '/mainhome/profile',
    label: 'Thông tin cá nhân',
    icon: <UserOutlined style={{ fontSize: 18 }} />,
  });

  if (isAdmin || !isCommitteeRole) {
    navItems.push({
      path: '/mainhome/statistics',
      label: 'Thống kê',
      icon: <PieChartOutlined style={{ fontSize: 18 }} />,
    });
  }

  navItems.push({
    path: '/mainhome/notifications',
    label: 'Thông báo',
    icon: <BellOutlined style={{ fontSize: 18 }} />,
    badge: unreadCount,
  });

  if (isAdmin) {
    navItems.push(
      { path: '/mainhome/admin/users', label: 'Quản lý tài khoản', icon: <TeamOutlined style={{ fontSize: 18 }} /> },
      { path: '/mainhome/admin/councils', label: 'Quản lý hội đồng', icon: <AuditOutlined style={{ fontSize: 18 }} /> },
      { path: '/mainhome/admin/topics', label: 'Quản lý đề tài', icon: <FileOutlined style={{ fontSize: 18 }} /> },
    );
  }

  if (!isAdmin || canAccessCouncil) {
    navItems.push({
      path: '/mainhome/progress-demo',
      label: 'Quản lý tiến độ',
      icon: <BarChartOutlined style={{ fontSize: 18 }} />,
    });
  }

  if (canAccessCouncil) {
    navItems.push(
      { path: '/mainhome/approvedtopics', label: 'Đề tài hội đồng', icon: <FileOutlined style={{ fontSize: 18 }} /> },
      { path: '/mainhome/statistics/council', label: 'Thống kê hội đồng', icon: <AuditOutlined style={{ fontSize: 18 }} /> },
    );
  }

  // Xác định mục hiện tại đang được chọn
  const currentItem = navItems.find((item) => {
    if (item.path === '/mainhome') {
      return location.pathname === '/mainhome';
    }
    return location.pathname.startsWith(item.path);
  }) || navItems[0];

  // Menu items cho Dropdown trên điện thoại
  const dropdownMenuItems = navItems.map((item) => {
    const isActive = item.path === '/mainhome'
      ? location.pathname === '/mainhome'
      : location.pathname.startsWith(item.path);

    return {
      key: item.path,
      icon: item.icon,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 200 }}>
          <span>{item.label}</span>
          {item.badge && item.badge > 0 ? (
            <Badge count={item.badge} style={{ backgroundColor: '#ff4d4f' }} />
          ) : null}
        </div>
      ),
      onClick: () => navigate(item.path),
      style: isActive
        ? {
            backgroundColor: '#f6ffed',
            color: '#389e0d',
            fontWeight: 600,
            borderRadius: 6,
          }
        : {
            borderRadius: 6,
          },
    };
  });

  return (
    <>
      <Content style={{ marginTop: 60 }}>
        <Row gutter={[16, 16]}>
          {/* MOBILE & TABLET DROPDOWN (chỉ hiển thị trên điện thoại & tablet < 992px) */}
          <Col xs={24} lg={0} className="mobile-dropdown-col" style={{ padding: '0 12px 14px 12px' }}>
            <Dropdown
              menu={{
                items: dropdownMenuItems,
                style: {
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  padding: 8,
                  borderRadius: 10,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                },
              }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button
                block
                size="large"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 48,
                  borderRadius: 8,
                  border: '1.5px solid #52c41a',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                  padding: '0 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <span style={{ color: '#52c41a', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                    {currentItem?.icon}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#262626',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentItem?.label || 'Chức năng'}
                  </span>
                  {currentItem?.badge && currentItem.badge > 0 ? (
                    <Badge count={currentItem.badge} style={{ backgroundColor: '#ff4d4f' }} />
                  ) : null}
                </div>
                <DownOutlined style={{ color: '#52c41a', fontSize: 14 }} />
              </Button>
            </Dropdown>
          </Col>

          {/* DESKTOP SIDER (chỉ hiển thị trên máy tính >= 992px) */}
          <Col xs={0} lg={5} xl={4} className="desktop-sider-col">
            <ul className="item-sider">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/mainhome'}
                    className="li-link"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <Badge count={item.badge} style={{ backgroundColor: '#ff4d4f', textAlign: 'center' }} />
                        ) : null}
                      </div>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </Col>

          {/* NỘI DUNG CHÍNH */}
          <Col xs={24} lg={19} xl={20}>
            <Outlet />
          </Col>
        </Row>
      </Content>
    </>
  );
};

export default MainHome;

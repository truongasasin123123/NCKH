import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { Button, Dropdown, Space, message, Layout } from "antd";
import { DownOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import Home from "./pages/Home";
import Login from "./pages/Login"
import Register from "./pages/Register";
import ForgotPassword from "./pages/Forgot";
import MainHome from "./pages/MainHome"
import ChangePass from "./pages/ChangePass";
import RegisterTopic from "./pages/RegisterTopic";
import MyTopics from "./pages/MyTopics";
import Notifications from "./pages/Notifications";
import "./App.css";
import { jwtDecode } from "jwt-decode";
import TopicDetail from "./pages/TopicDetail";
import Profile from "./pages/Profile";
import ApprovedTopics from "./pages/ApprovedTopics";
import TopicDetailCommittee from "./pages/TopicDetailCommittee";
import ProgressManagement from "./pages/ProgressManagement";
import AdminUsers from "./pages/AdminUsers";
import CouncilList from "./pages/QuanTriHeThong/CouncilList";
import CouncilDetail from "./pages/QuanTriHeThong/CouncilDetail";
import DanhSachDeTai from "./pages/QuanTriHeThong/MonitoringCommittee";
import ChiTietBaoCao from "./pages/QuanTriHeThong/ReportDetail";
import Acceptance from "./pages/Acceptance";
import TopicManagement from "./pages/QuanTriHeThong/TopicManagement";

interface JwtPayload {
  TaiKhoan: string;
  TenDayDu: string;
}

function App() {

  const [profile, setProfile] = useState<{ TenDayDu?: string } | null>(null);

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  const user: JwtPayload | null = token ? jwtDecode(token) : null;
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await ApiAxios.get("/auth/profile");
        setProfile(res.data);
      } catch (error) {
        console.error("Lỗi lấy thông tin hồ sơ:", error);
      }
    };

    fetchProfile();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
    message.success("Đã đăng xuất");
    navigate("/");
  };

  const userMenu: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => navigate("/mainhome/profile"),
    },
    {
      key: "settings",
      label: "Đổi mật khẩu",
      icon: <SettingOutlined />,
      onClick: () => navigate("/change-password"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <header className="main-menu">
        <div className="item-nvarbar">
          <Link to="/"  >
            <img
              src="\logo.png"
              alt="logo"
              className="home-logo"
            />
          </Link>


        </div>

        <div className="user-nvarbar">
          {!user ? (
            <Link to="/login" className="header-auth">
              <Button type="primary">Đăng nhập / Đăng ký</Button>
            </Link>
          ) : (
            <Dropdown menu={{ items: userMenu }} trigger={["click"]}>
              <Button type="primary" className="header-auth">
                <Space>
                  {profile?.TenDayDu || user?.TaiKhoan}
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          )}
        </div>
      </header>

      <Layout style={{ minHeight: "100vh", background: "#f5f5f5", overflowX: "hidden" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/home" element={<Home />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePass />} />
          <Route path="/mainhome" element={<MainHome />}>
            <Route path="profile" element={<Profile />} />
            <Route index element={<MyTopics />} />
            <Route path="registertopic" element={<RegisterTopic />} />
            <Route path="approvedtopics" element={<ApprovedTopics />} />
            <Route path="topic/:MaDT" element={<TopicDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="topic-committee/:MaDT" element={<TopicDetailCommittee />} />
            <Route path="progress/:maDT" element={<ProgressManagement />} />
            <Route path="progress-demo" element={<ProgressManagement />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/councils" element={<CouncilList />} />
            <Route path="admin/councils/:maHoiDong" element={<CouncilDetail />} />
            <Route path="hoi-dong-theo-doi" element={<DanhSachDeTai />} />
            <Route path="hoi-dong-theo-doi/:maDT" element={<ChiTietBaoCao />} />
            <Route path="acceptance/:maDT" element={<Acceptance />} />
            <Route path="admin/councils/:maHoiDong" element={<CouncilDetail />} />
            <Route path="admin/topics" element={<TopicManagement />} />   {/* thêm dòng này */}
            <Route path="admin/topics/:MaDT" element={<TopicDetail />} />
            <Route path="admin/adjustment-requests" element={<AdjustmentRequestManagement />} />
          </Route>
        </Routes>
      </Layout>

      <footer style={{ background: '#0f4a28', padding: '28px 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 6 }}>VNUA Research</span>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
              Hệ thống quản lý đề tài khoa học<br />Học viện Nông nghiệp Việt Nam
            </p>
          </div>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hệ thống</h4>
              {['Đề tài', 'Tiến độ', 'Báo cáo'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liên hệ</h4>
              {['Đường Ngô Xuân Quảng, Gia Lâm', 'webmaster@vnua.edu.vn', '84.024.abcdxyz'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>© 2025 VNUA. All rights reserved.</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Phiên bản 1.0.0</span>
        </div>
      </footer>

    </>
  )
}

export default App;

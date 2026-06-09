import React from 'react';
import { useNavigate } from 'react-router-dom';
import {ControlOutlined,LockOutlined, BarChartOutlined } from '@ant-design/icons';

const topics = [
    { id: 'DT001', name: 'Nghiên cứu giống lúa chịu hạn vùng đồng bằng sông Hồng', owner: 'Nguyễn Văn A', status: 'Đang thực hiện', percent: 72 },
    { id: 'DT002', name: 'Ứng dụng IoT trong giám sát chất lượng đất nông nghiệp', owner: 'Trần Thị B', status: 'Chờ nghiệm thu', percent: 95 },
    { id: 'DT003', name: 'Phân tích chuỗi giá trị nông sản xuất khẩu khu vực phía Bắc', owner: 'Lê Văn C', status: 'Hoàn thành', percent: 100 },
];

const activities = [
    { dot: 'green', title: 'DT001 — Cập nhật mốc tiến độ tháng 5', meta: 'Nguyễn Văn A · 2 giờ trước' },
    { dot: 'amber', title: 'DT004 — Sắp đến hạn nộp báo cáo giữa kỳ', meta: 'Hệ thống · 5 giờ trước' },
    { dot: 'green', title: 'DT002 — Nộp hồ sơ nghiệm thu thành công', meta: 'Trần Thị B · Hôm qua' },
    { dot: 'gray', title: 'DT007 — Đề tài mới được phê duyệt', meta: 'Ban quản lý · 2 ngày trước' },
];

const statusStyle: Record<string, React.CSSProperties> = {
    'Đang thực hiện': { background: '#e8f5e9', color: '#2e7d32' },
    'Chờ nghiệm thu': { background: '#fff3e0', color: '#e65100' },
    'Hoàn thành': { background: '#e8eaf6', color: '#3949ab' },
};

const progressColor: Record<string, string> = {
    'Đang thực hiện': '#1a6e3c',
    'Chờ nghiệm thu': '#f59e0b',
    'Hoàn thành': '#3949ab',
};

const dotColor: Record<string, string> = {
    green: '#1a6e3c',
    amber: '#f59e0b',
    gray: '#9e9e9e',
};

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div style={{ fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif", background: '#f7f9f7', minHeight: '100vh' }}>

            {/* NAV */}
            <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: 60, background: '#1a6e3c', position: 'sticky', top: 0, zIndex: 100 }}>

            </nav>

            {/* HERO */}
            <div style={{
                background: 'linear-gradient(150deg,#0f4a28 0%,#1a6e3c 55%,#2d9e5f 100%)',
                padding: '52px 2rem 0',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3rem',
                minHeight: 320,
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Ảnh nền phía sau bên phải */}
                <img
                    src="/HomePicture.png"
                    alt="Toà nhà trung tâm VNUA"
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: '45%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 30%, black 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 30%, black 100%)',
                    }}
                />

                {/* Text đè lên ảnh */}
                <div style={{ flex: 1, paddingBottom: '3rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                        🌾 Học viện Nông nghiệp Việt Nam
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 12 }}>
                        Hệ thống quản lý<br />đề tài khoa học
                    </h1>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: 420, marginBottom: 28 }}>
                        Nền tảng hỗ trợ quản lý, theo dõi tiến độ và đánh giá đề tài nghiên cứu khoa học một cách hiệu quả, minh bạch.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => navigate('/mainhome')}
                            style={{ background: '#fff', color: '#1a6e3c', border: 'none', padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                            Xem đề tài của tôi
                        </button>
                        <button style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', padding: '10px 22px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                            Tìm hiểu thêm
                        </button>
                    </div>
                </div>
            </div>

            {/* STATS BAR */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e8ece8', display: 'flex', justifyContent: 'center' }}>
                {[
                    { num: '0', label: 'Đề tài đang thực hiện' },
                    { num: '0', label: 'Đề tài hoàn thành' },
                    { num: '0', label: 'Thành viên tham gia' },
                    { num: '0', label: 'Tỉ lệ đúng tiến độ' },
                ].map((s, i, arr) => (
                    <div key={s.label} style={{ flex: 1, maxWidth: 180, padding: '18px 0', textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #e8ece8' : 'none' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a6e3c' }}>{s.num}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* TOPICS */}
            <div style={{ padding: '32px 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Đề tài nổi bật</h2>
                    <a href="#" style={{ fontSize: 13, color: '#1a6e3c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Xem tất cả →
                    </a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    {topics.map(t => (
                        <div key={t.id} style={{ background: '#fff', border: '1px solid #e2eae2', borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a6e3c')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2eae2')}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                <span style={{ ...statusStyle[t.status], fontSize: 11, padding: '2px 9px', borderRadius: 10, fontWeight: 600 }}>{t.status}</span>
                                <span style={{ fontSize: 11, color: '#aaa' }}>{t.id}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.45 }}>{t.name}</div>
                            <div style={{ fontSize: 12, color: '#777', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                                {t.owner}
                            </div>
                            <div style={{ height: 5, background: '#eef2ee', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${t.percent}%`, background: progressColor[t.status], borderRadius: 3 }} />
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 5 }}>{t.percent}% hoàn thành</div>
                        </div>
                    ))}
                </div> 
            </div>

            {/* FEATURES */}
            <div style={{ background: '#f0f4f0', padding: '32px 2rem' }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 20 }}>Tính năng chính</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                    {[
                        { icon: <ControlOutlined />, bg: '#e8f5e9', title: 'Quản lý đề tài', desc: 'Theo dõi tiến độ, trạng thái và thông tin chi tiết từng đề tài theo thời gian thực.' },
                        { icon: <LockOutlined />, bg: '#e3f2fd', title: 'Phân quyền rõ ràng', desc: 'Cấp quyền theo vai trò, bảo mật dữ liệu, giới hạn truy cập theo phân cấp quản lý.' },
                        { icon: <BarChartOutlined />, bg: '#fff3e0', title: 'Báo cáo & thống kê', desc: 'Tổng hợp dữ liệu, xuất báo cáo nhanh chóng và chính xác phục vụ kiểm duyệt.' },
                    ].map(f => (
                        <div key={f.title} style={{ background: '#fff', border: '1px solid #e2eae2', borderRadius: 12, padding: '20px' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>{f.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>{f.title}</div>
                            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ACTIVITY */}
            <div style={{ padding: '32px 2rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Hoạt động gần đây</h2>
                    <a href="#" style={{ fontSize: 13, color: '#1a6e3c', textDecoration: 'none' }}>Xem thêm →</a>
                </div>
                <div>
                    {activities.map((a, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i < activities.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor[a.dot], flexShrink: 0, marginTop: 5 }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{a.title}</div>
                                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{a.meta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER */}


        </div>
    );
};

export default HomePage;
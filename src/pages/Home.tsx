import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Layout, Space, Typography } from 'antd';
import { ArrowRightOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { getCouncilMembership } from '../services/progress/ProgressService';
import TopicLookup from './TopicLookup';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCouncilMember, setIsCouncilMember] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

  useEffect(() => {
    if (!token) return;
    getCouncilMembership().then((data) => setIsCouncilMember(data.isCouncilMember)).catch(() => setIsCouncilMember(false));
  }, [token]);

  const handleOpenLookup = () => {
    setShowLookup(true);
    // Đợi phần tử render xong rồi mới scroll tới
    setTimeout(() => {
      document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <Layout style={{ background: '#f7f9f7' }}>
      <Content style={{ padding: 0 }}>
        <div style={{ overflow: 'hidden', background: '#fff' }}>
          <section style={{ background: 'linear-gradient(150deg,#0f4a28 0%,#1a6e3c 55%,#2d9e5f 100%)', minHeight: 'calc(100vh - 50px)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <img
              src="/HomePicture.png"
              alt="Toà nhà trung tâm VNUA"
              style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', objectFit: 'cover', objectPosition: 'center', maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 28%, black 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 28%, black 100%)' }}
            />
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, padding: '64px 48px' }}>
              <Title level={1} style={{ color: '#fff', fontSize: 'clamp(3.2rem, 4vw, 4.8rem)', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Hệ thống quản lý đề tài khoa học</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.82)', fontSize: 18, lineHeight: 1.8, maxWidth: 520, marginTop: 24, marginBottom: 36 }}>Nền tảng hỗ trợ quản lý, theo dõi tiến độ và đánh giá đề tài nghiên cứu khoa học một cách hiệu quả, minh bạch và dễ tiếp cận.</Paragraph>
              <Space wrap size={8}>
                {token && <Button size="large" onClick={() => navigate(isCouncilMember ? '/mainhome/approvedtopics' : '/mainhome')} icon={<ArrowRightOutlined />} style={{ height: 50, border: 0, borderRadius: 12, color: '#1a6e3c', fontWeight: 600, paddingInline: 28 }}>{isCouncilMember ? 'Xem đề tài hội đồng' : 'Xem đề tài của tôi'}</Button>}
                {token && <Button size="large" ghost onClick={handleOpenLookup} icon={<SearchOutlined />} style={{ height: 50, borderRadius: 12, paddingInline: 28 }}>Tra cứu đề tài</Button>}
                {!token && <Button size="large" type="primary" onClick={() => navigate('/login')} style={{ height: 50, borderRadius: 12, background: '#fff', color: '#1a6e3c', border: 0, paddingInline: 28 }}>Đăng nhập để tra cứu</Button>}
              </Space>
            </div>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          </section>
          {token && showLookup && (
            <section id="lookup" style={{ padding: '40px 24px 64px', background: '#f7f9f7' }}>
              <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <Title level={4} style={{ color: '#0f4a28', margin: '0 0 2px' }}>Tra cứu đề tài toàn hệ thống</Title>
                    <Paragraph style={{ color: '#6b7d70', fontSize: 13, marginBottom: 16 }}>Tìm kiếm và xem thông tin công khai của các đề tài trong hệ thống.</Paragraph>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => setShowLookup(false)}
                    style={{ color: '#6b7d70' }}
                  />
                </div>
                <TopicLookup compact />
              </div>
            </section>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default HomePage;
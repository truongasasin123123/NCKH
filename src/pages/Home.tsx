import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Space, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getCouncilMembership } from './ThongTinDeTai/ProgressService';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const features = [
    {
        title: 'Quản lý đề tài tập trung',
        description:
            'Lưu trữ đề tài, báo cáo và tiến độ trong một nền tảng duy nhất để thao tác nhanh và chính xác.',
    },
    {
        title: 'Theo dõi tiến độ',
        description:
            'Cập nhật trạng thái tự động, thông báo nhắc nhở và biểu đồ tiến độ giúp bạn nắm rõ toàn bộ dự án.',
    },
    {
        title: 'Đánh giá minh bạch',
        description:
            'Hội đồng phản hồi, lưu trữ ý kiến và điểm số rõ ràng, đảm bảo quá trình nghiệm thu công bằng.',
    },
];

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [isCouncilMember, setIsCouncilMember] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) return;
        getCouncilMembership()
            .then((data) => setIsCouncilMember(data.isCouncilMember))
            .catch(() => setIsCouncilMember(false));
    }, []);

    return (
        <Layout style={{ background: '#f7f9f7', minHeight: '100vh' }}>
            <Content>
                {/* HERO */}
                <div
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 'calc(100vh - 80px)',
                        background: 'linear-gradient(150deg,#0f4a28 0%,#1a6e3c 55%,#2d9e5f 100%)',
                    }}
                >
                    <img
                        src="/HomePicture.png"
                        alt="Toà nhà trung tâm VNUA"
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: '50%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 28%, black 100%)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 28%, black 100%)',
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            left: -80,
                            top: -80,
                            width: 360,
                            height: 360,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Row style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 80px)' }} align="middle">
                        <Col xs={24} md={14} style={{ padding: '64px 48px', maxWidth: 720 }}>


                            <Title
                                level={1}
                                style={{
                                    color: '#fff',
                                    margin: 0,
                                    lineHeight: 1.1,
                                    fontSize: 'clamp(3.2rem, 4vw, 4.8rem)',
                                    fontWeight: 700,
                                }}
                            >
                                Hệ thống quản lý đề tài khoa học
                            </Title>

                            <Paragraph
                                style={{
                                    color: 'rgba(255,255,255,0.82)',
                                    fontSize: 18,
                                    lineHeight: 1.8,
                                    maxWidth: 520,
                                    marginTop: 24,
                                    marginBottom: 36,
                                }}
                            >
                                Nền tảng hỗ trợ quản lý, theo dõi tiến độ và đánh giá đề tài nghiên cứu khoa học
                                một cách hiệu quả, minh bạch và dễ tiếp cận cho cán bộ, giảng viên và sinh viên.
                            </Paragraph>

                            <Space size={12} wrap>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => navigate(isCouncilMember ? '/mainhome/approvedtopics' : '/mainhome')}
                                    icon={<ArrowRightOutlined />}
                                    style={{
                                        background: '#fff',
                                        color: '#1a6e3c',
                                        border: 'none',
                                        fontWeight: 600,
                                        height: 50,
                                        paddingInline: 28,
                                    }}
                                >
                                    {isCouncilMember ? 'Xem đề tài hội đồng' : 'Xem đề tài của tôi'}
                                </Button>
                                <Button
                                    size="large"
                                    ghost
                                    style={{
                                        color: '#fff',
                                        borderColor: 'rgba(255,255,255,0.35)',
                                        height: 50,
                                        paddingInline: 28,
                                    }}
                                >
                                    Tìm hiểu thêm
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <div style={{ padding: '72px 24px 96px', background: '#f7f9f7' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <Title level={2} style={{ marginBottom: 16, color: '#0f4a28' }}>
                                Thiết kế để kết nối và theo dõi tiến độ mọi lúc
                            </Title>
                            <Paragraph style={{ color: '#4b5d4d', fontSize: 16, lineHeight: 1.75, maxWidth: 760, margin: '0 auto' }}>
                                Từ đăng ký đề tài đến nghiệm thu cuối cùng, hệ thống giúp giảm thủ tục giấy tờ và tăng cường
                                minh bạch cho toàn bộ quy trình nghiên cứu.
                            </Paragraph>
                        </div>

                        <Row gutter={[24, 24]}>
                            {features.map((feature) => (
                                <Col xs={24} sm={12} lg={8} key={feature.title}>
                                    <div
                                        style={{
                                            background: '#fff',
                                            borderRadius: 24,
                                            padding: '32px 28px',
                                            minHeight: 220,
                                            boxShadow: '0 20px 50px rgba(15, 74, 40, 0.08)',
                                        }}
                                    >
                                        <Title level={4} style={{ marginBottom: 16, color: '#165a2d' }}>
                                            {feature.title}
                                        </Title>
                                        <Paragraph style={{ margin: 0, color: '#5a6c61', lineHeight: 1.8 }}>
                                            {feature.description}
                                        </Paragraph>
                                    </div>
                                </Col>
                            ))}
                        </Row>


                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default HomePage;

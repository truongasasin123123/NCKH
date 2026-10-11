import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';
import MyTopicsStatistics from './MyTopicsStatistics';
import StatisticsDashboard from './StatisticsDashboard';

interface JwtPayload { VaiTro?: string; }

export default function Statistics() {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const user = token ? jwtDecode<JwtPayload>(token) : null;
  const role = (user?.VaiTro || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/\s/g, '');

  if (role === 'admin' || role === 'quantri') {
    return <StatisticsDashboard />;
  }

  if (role.includes('sinhvien')) {
    return <MyTopicsStatistics />;
  }

  return <Navigate to="/mainhome" replace />;
}

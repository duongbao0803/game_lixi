import { useNavigate } from 'react-router-dom';
import './SuccessPage.css';

export function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className='success-screen'>
      <div className='success-background' />
      <div className='success-content'>
        <h1>🌸 Đã Đăng Ký Thành Công 🌸</h1>
        <p>Tài khoản này đã tham gia hội đua xuân rồi.</p>
        <p>Vui lòng chờ kết quả từ ban tổ chức!</p>
        <button className='back-btn' onClick={() => navigate('/auth')}>
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
}

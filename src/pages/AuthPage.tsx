import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FallingPetals } from '../components/auth/FallingPetals';
import { IntroVideo } from '../components/auth/IntroVideo';
import { LoginForm } from '../components/auth/LoginForm';
import { useUser } from '../contexts/UserContext';
import './AuthPage.css';

export function AuthPage() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState({
    email: 'test',
    account: '123456789012',
  });
  const [showIntro, setShowIntro] = useState(true);
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isAuthFadingOut, setIsAuthFadingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localUser.email && localUser.account) {
      const fullEmail = localUser.email.endsWith('@pnj.com.vn')
        ? localUser.email
        : `${localUser.email}@pnj.com.vn`;

      if (localUser.account.length !== 12) {
        alert('STK phải có đúng 12 chữ số!');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api-pnj/horse-racing/v1/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': 'BB70PeT9903j9Wrddyk7Y88sqzPdWKty67OdoQkf',
          },
          body: JSON.stringify({
            email: fullEmail,
            bank_account: localUser.account,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Đăng nhập không thành công');
        }

        const data = await response.json();
        if (data.exists) {
          setIsAuthFadingOut(true);
          setTimeout(() => {
            setUser({ ...localUser, email: fullEmail });
            navigate('/success');
          }, 1000);
          return;
        }

        setIsAuthFadingOut(true);
        setTimeout(() => {
          setUser({ ...localUser, email: fullEmail });
          navigate('/game');
        }, 1000);
      } catch (error: any) {
        console.error('Login error:', error);
        alert(`Lỗi đăng nhập: ${error.message}`);
        setIsLoading(false);
      }
    } else {
      alert('Vui lòng điền đầy đủ thông tin!');
    }
  };

  const handleTimeUpdate = (video: HTMLVideoElement) => {
    if (!isFadingOut) {
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= 1.0) {
        setIsFadingOut(true);
        setTimeout(() => handleVideoEnd(), 1000);
      }
    }
  };

  const handleVideoEnd = () => {
    if (showIntro) {
      setShowIntro(false);
      setIsIntroFinished(true);
    }
  };

  return (
    <div
      className={`auth-screen ${isAuthFadingOut ? 'zoom-active' : ''} ${isIntroFinished ? 'intro-done' : ''} ${isFadingOut ? 'show-bg' : ''}`}
    >
      <div className='auth-background' />

      <div className='auth-content-layer'>
        <FallingPetals />
        <LoginForm
          localUser={localUser}
          setLocalUser={setLocalUser}
          handleLogin={handleLogin}
          isLoading={isLoading}
        />
      </div>

      {showIntro && (
        <IntroVideo
          isFadingOut={isFadingOut}
          handleVideoEnd={handleVideoEnd}
          handleTimeUpdate={handleTimeUpdate}
        />
      )}
    </div>
  );
}

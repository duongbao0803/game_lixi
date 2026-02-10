import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import videoIntro from '../assets/video-intro.mp4';
import videoIntroAmThanh from '../assets/video-intro-am-thanh.mp4';
import introAudio from '../assets/am-thanh.m4a';
import './AuthPage.css';

export function AuthPage() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState({
    email: 'test',
    account: '123456789012',
  });
  const [showIntro, setShowIntro] = useState(true); // Show video first
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isAuthFadingOut, setIsAuthFadingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localUser.email && localUser.account) {
      // Formatted email for consistent payload
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
        console.log('Login response:', data);

        // Participation check
        if (data.exists) {
          setIsAuthFadingOut(true);
          setTimeout(() => {
            setUser({ ...localUser, email: fullEmail });
            navigate('/success');
          }, 1000);
          return;
        }

        // Zoom into game transition for new participants
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

  const handleTimeUpdate = () => {
    if (videoRef.current && !isFadingOut) {
      const timeLeft = videoRef.current.duration - videoRef.current.currentTime;
      // Start transition 0.5s before end
      if (timeLeft <= 0.5) {
        setIsFadingOut(true);
        // Hide video overlay exactly when transition ends
        setTimeout(() => {
          handleVideoEnd();
        }, 500);
      }
    }
  };

  const handleVideoEnd = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    // Instead of navigating to /game, we now show the form
    if (showIntro) {
      setShowIntro(false);
      setIsIntroFinished(true);
    }
  };

  const petals = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className={`petal ${Math.random() > 0.5 ? 'type-1' : 'type-2'}`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${5 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      )),
    [],
  );

  if (showIntro) {
    // We keep the main structure and overlay the video to ensure smooth transition
    // without black flashes (unmounting/remounting issues)
    // The video container is rendered inside the main return now
  }

  // 1. HARD RESET on Mount: Ensure no leftover audio/video is playing from previous session
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, []);

  // 2. Synchronized Media Control
  useEffect(() => {
    if (!showIntro || !videoRef.current || !audioRef.current) return;

    const video = videoRef.current;
    const audio = audioRef.current;

    const attemptPlay = async () => {
      try {
        // Always sync time before playing
        audio.currentTime = video.currentTime;
        video.muted = true; // FORCE MUTED to prevent embedded sound overlap
        await video.play();
        await audio.play();
      } catch (err) {
        // Fallback: Autoplay requirements not met
        video.muted = true;
        video.play().catch(() => {});
        // Audio will stay paused until 'handleUserInteraction' triggers
      }
    };

    const handleUserInteraction = () => {
      attemptPlay();
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
      }
    };

    const events = ['click', 'touchstart', 'mousedown', 'keydown'];
    events.forEach(e => window.addEventListener(e, handleUserInteraction, { once: true }));

    // Start playback attempt
    attemptPlay();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleUserInteraction));
    };
  }, [showIntro]);

  return (
    <div
      className={`auth-screen ${isAuthFadingOut ? 'zoom-active' : ''} ${isIntroFinished ? 'intro-done' : ''}`}
    >
      <div className='auth-background' />

      {/* Content Layer - Fades out during zoom */}
      <div className='auth-content-layer'>
        <div className='falling-petals'>{petals}</div>
        <div className='auth-container tet-theme'>
          <h1>🌸 Hội Đua Ngựa Xuân 🌸</h1>
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <div className='input-group'>
              <div className='suffix-wrapper'>
                <input
                  type='text'
                  className='input-with-suffix'
                  placeholder='Nhập Email'
                  value={localUser.email}
                  onChange={e => {
                    let val = e.target.value;
                    if (val.endsWith('@pnj.com.vn')) {
                      val = val.replace('@pnj.com.vn', '');
                    }
                    setLocalUser({ ...localUser, email: val });
                  }}
                  required
                  autoComplete='off'
                />
                <span className='email-suffix'>@pnj.com.vn</span>
              </div>
            </div>
            <div className='input-group'>
              <input
                type='tel'
                inputMode='numeric'
                pattern='[0-9]*'
                placeholder='Nhập STK Vietinbank (12 số)'
                value={localUser.account}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setLocalUser({ ...localUser, account: val });
                }}
                required
                autoComplete='off'
              />
            </div>
            <button type='submit' className='start-btn' disabled={isLoading}>
              {isLoading ? 'Đang Khai Xuân...' : 'Khai Xuân Đắc Lộc'}
            </button>
          </form>
        </div>
      </div>

      {/* Video Overlay Layer */}
      {showIntro && (
        <>
          <audio ref={audioRef} src={introAudio} preload='auto' />
          <div className={`intro-video-container ${isFadingOut ? 'fade-out' : ''}`}>
            <video
              ref={videoRef}
              src={videoIntro}
              muted
              playsInline
              className='intro-video'
              onPlay={() => {
                if (audioRef.current && videoRef.current) {
                  audioRef.current.currentTime = videoRef.current.currentTime;
                  audioRef.current.play().catch(() => {});
                }
              }}
              onPause={() => {
                if (audioRef.current) audioRef.current.pause();
              }}
              onWaiting={() => {
                if (audioRef.current) audioRef.current.pause();
              }}
              onPlaying={() => {
                if (audioRef.current && videoRef.current) {
                  audioRef.current.currentTime = videoRef.current.currentTime;
                  audioRef.current.play().catch(() => {});
                }
              }}
              onTimeUpdate={() => {
                // Constant synchronization to prevent drift/delay
                if (audioRef.current && videoRef.current && !audioRef.current.paused) {
                  const diff = Math.abs(
                    audioRef.current.currentTime - videoRef.current.currentTime,
                  );
                  if (diff > 0.1) {
                    // Only force sync if they differ by more than 100ms
                    audioRef.current.currentTime = videoRef.current.currentTime;
                  }
                }
                handleTimeUpdate();
              }}
              onEnded={handleVideoEnd}
            />
            <button
              className='skip-btn'
              onClick={e => {
                e.preventDefault();
                if (audioRef.current) {
                  const fadeInterval = setInterval(() => {
                    if (audioRef.current && audioRef.current.volume > 0.1) {
                      audioRef.current.volume -= 0.1;
                    } else {
                      clearInterval(fadeInterval);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.volume = 1;
                      }
                    }
                  }, 50);
                }
                handleVideoEnd();
              }}
            >
              Bỏ Qua
            </button>
          </div>
        </>
      )}
    </div>
  );
}

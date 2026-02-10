import { useRef, useState, useEffect } from 'react';
import { type IRefPhaserGame, PhaserGame } from '../game/PhaserGame';
import { EventBus } from '../game/EventBus';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../App.css';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

export function GamePage() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!user.email || !user.account) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Game state: 'lobby' | 'tutorial' | 'countdown' | 'racing' | 'finished'
  const [gameState, setGameState] = useState<
    'lobby' | 'tutorial' | 'countdown' | 'racing' | 'finished'
  >('lobby'); // Start at lobby since auth is separate

  const [playerHorseIndex, setPlayerHorseIndex] = useState<number>(0);
  const [rank, setRank] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(3);
  const [results, setResults] = useState<{ id: number; time: number }[]>([]);
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  const markAsPlayed = (account: string) => {
    const played = localStorage.getItem('played_accounts');
    let accounts = played ? JSON.parse(played) : [];
    if (!accounts.includes(account)) {
      accounts.push(account);
      localStorage.setItem('played_accounts', JSON.stringify(accounts));
    }
  };

  useEffect(() => {
    const handleGameOver = (data: { rank: number; results: { id: number; time: number }[] }) => {
      setRank(data.rank);
      setResults(data.results || []);

      // Mark as played immediately when game finishes
      if (user.account) {
        markAsPlayed(user.account);
      }

      // Delay showing result slightly for finish line cross effect
      setTimeout(() => {
        setGameState('finished');
      }, 1000);
    };

    EventBus.on('game-over', handleGameOver);

    return () => {
      EventBus.removeListener('game-over', handleGameOver);
    };
  }, [user.account]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('racing');
            EventBus.emit('start-race'); // Start the horses in Phaser
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Effect to trigger tutorial when in tutorial state
  useEffect(() => {
    if (gameState === 'tutorial') {
      const driverObj = driver({
        showProgress: false,
        popoverClass: 'game-driver-popover',
        steps: [
          {
            element: '#game-container',
            popover: {
              title: 'Chào mừng đến Trường Đua!',
              description: 'Hãy sẵn sàng cho những khoảnh khắc nghẹt thở sắp tới.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tutorial-target',
            popover: {
              title: 'Nhấn để Tăng Tốc!',
              description:
                'Đây là chiến mã của bạn! Hãy NHẤN LIÊN TỤC vào màn hình hoặc con ngựa để bức tốc về đích!',
              side: 'top',
              align: 'center',
            },
          },
        ],
        onDestroyStarted: () => {
          driverObj.destroy();
          setGameState('countdown');
          setCountdown(3);
        },
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Sẵn sàng!',
      });

      setTimeout(() => {
        driverObj.drive();
      }, 500);
    }
  }, [gameState]);

  // const exitFullScreen = () => {
  //   if (document.exitFullscreen) {
  //     document.exitFullscreen().catch(() => {});
  //   } else if ((document as any).webkitExitFullscreen) {
  //     (document as any).webkitExitFullscreen();
  //   }
  // };

  // const triggerFullScreen = () => {
  //   // Only attempt if not already full
  //   if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
  //     if (document.documentElement.requestFullscreen) {
  //       document.documentElement.requestFullscreen().catch(() => {});
  //     } else if ((document.documentElement as any).webkitRequestFullscreen) {
  //       (document.documentElement as any).webkitRequestFullscreen();
  //     }
  //   }
  // };

  // Orientation auto-fullscreen logic
  // useEffect(() => {
  //   const checkFS = () => {
  //     const isLandscape = window.innerWidth > window.innerHeight;
  //     if (isLandscape) {
  //       triggerFullScreen();
  //     } else {
  //       exitFullScreen();
  //     }
  //   };
  //
  //   const handleGlobalInteraction = () => {
  //     checkFS();
  //   };
  //
  //   window.addEventListener('resize', checkFS);
  //   window.addEventListener('orientationchange', checkFS);
  //   // Any interaction anywhere on the screen should trigger FS if landscape
  //   window.addEventListener('click', handleGlobalInteraction);
  //   window.addEventListener('touchstart', handleGlobalInteraction);
  //
  //   // Initial check
  //   checkFS();
  //
  //   return () => {
  //     window.removeEventListener('resize', checkFS);
  //     window.removeEventListener('orientationchange', checkFS);
  //     window.removeEventListener('click', handleGlobalInteraction);
  //     window.removeEventListener('touchstart', handleGlobalInteraction);
  //   };
  // }, []); // Run only once to handle global behavior

  const startGame = (index: number) => {
    // triggerFullScreen();
    setPlayerHorseIndex(index);
    setGameState('tutorial');
  };

  const resetGame = () => {
    logout();
    setRank(0);
    setPlayerHorseIndex(0);
    setResults([]);
    navigate('/auth');
  };

  const getReward = (rank: number) => {
    switch (rank) {
      case 1:
        return '1.000.000đ';
      case 2:
        return '500.000đ';
      case 3:
        return '200.000đ';
      default:
        return '0đ';
    }
  };

  if (!user.email || !user.account) return null; // Avoid flicker

  return (
    <div id='app' className='game-entry-animation'>
      {/* Fixed Landscape Overlay */}
      {/* <div className='landscape-warning'>
        <div className='warning-icon'>📱</div>
        <h2>Vui lòng xoay ngang màn hình</h2>
        <p>Trò chơi chỉ hỗ trợ chế độ màn hình ngang để có trải nghiệm tốt nhất.</p>
      </div> */}

      {gameState === 'lobby' && (
        <div className='lobby'>
          <h2>Chọn Chiến Mã Của Bạn</h2>
          <p>
            Xin chào, <span style={{ color: '#f1c40f' }}>{user.account}</span>!
          </p>
          <div className='horse-selection grid'>
            {[0, 1, 2, 3, 4].map(index => (
              <button
                key={index}
                onClick={() => startGame(index)}
                className={`horse-btn horse-${index}`}
              >
                <div className='horse-img-wrapper'>
                  <img
                    src='/assets/horse_run_0.svg'
                    alt={`Ngựa ${index + 1}`}
                    className='horse-icon-img'
                  />
                </div>
                <span className='horse-label'>Ngựa {index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(gameState === 'tutorial' ||
        gameState === 'countdown' ||
        gameState === 'racing' ||
        gameState === 'finished') && (
        <div className='game-wrapper'>
          <PhaserGame ref={phaserRef} playerHorseIndex={playerHorseIndex} />

          {gameState === 'countdown' && (
            <div className='countdown-overlay'>
              <h1 className='countdown-number'>{countdown}</h1>
            </div>
          )}

          {gameState === 'finished' && (
            <div className='popup-overlay'>
              <div className='popup'>
                <h2>KẾT QUẢ CUỘC ĐUA</h2>

                <div className='leaderboard'>
                  <div className='leaderboard-row header'>
                    <span>#</span>
                    <span>Ngựa</span>
                    <span>Thời Gian</span>
                  </div>
                  {results.length > 0 ? (
                    results.map((r, i) => (
                      <div
                        key={r.id}
                        className={`leaderboard-row ${r.id === playerHorseIndex ? 'highlight' : ''}`}
                      >
                        <span>{i + 1}</span>
                        <span>
                          Ngựa {r.id + 1} {r.id === playerHorseIndex ? '(Bạn)' : ''}
                        </span>
                        <span>{(r.time / 1000).toFixed(2)}s</span>
                      </div>
                    ))
                  ) : (
                    <div className='leaderboard-row'>No results data</div>
                  )}
                </div>

                <div className='result-content'>
                  <div className='reward-info'>
                    <span>Tiền Thưởng:</span>
                    <span className='reward-amount'>{getReward(rank)}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Chờ chuyển vào STK: {user.account}
                  </p>
                </div>
                <button className='restart-btn' onClick={resetGame}>
                  Đăng Xuất
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

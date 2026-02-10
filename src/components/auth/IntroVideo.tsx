import { useRef, useEffect } from 'react';
import videoIntro from '../../assets/video-intro.mp4';
import introAudio from '../../assets/am-thanh.m4a';
import './IntroVideo.css';

interface IntroVideoProps {
  isFadingOut: boolean;
  handleVideoEnd: () => void;
  handleTimeUpdate: (video: HTMLVideoElement) => void;
}

export function IntroVideo({ isFadingOut, handleVideoEnd, handleTimeUpdate }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Hard Reset on Mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Synchronized Media Control
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const attemptPlay = async () => {
      try {
        audio.currentTime = video.currentTime;
        video.muted = true;
        await video.play();
        await audio.play();
      } catch (err) {
        video.muted = true;
        video.play().catch(() => {});
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

    attemptPlay();

    return () => {
      events.forEach(e => window.removeEventListener(e, handleUserInteraction));
    };
  }, []);

  const onSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) {
      const audio = audioRef.current;
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.1) {
          audio.volume -= 0.1;
        } else {
          clearInterval(fadeInterval);
          audio.pause();
          audio.volume = 1;
        }
      }, 50);
    }
    handleVideoEnd();
  };

  return (
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
          onPause={() => audioRef.current?.pause()}
          onWaiting={() => audioRef.current?.pause()}
          onPlaying={() => {
            if (audioRef.current && videoRef.current) {
              audioRef.current.currentTime = videoRef.current.currentTime;
              audioRef.current.play().catch(() => {});
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current && videoRef.current && !audioRef.current.paused) {
              const diff = Math.abs(audioRef.current.currentTime - videoRef.current.currentTime);
              if (diff > 0.1) {
                audioRef.current.currentTime = videoRef.current.currentTime;
              }
            }
            if (videoRef.current) handleTimeUpdate(videoRef.current);
          }}
          onEnded={handleVideoEnd}
        />
        <button className='skip-btn' onClick={onSkip}>
          Bỏ Qua
        </button>
      </div>
    </>
  );
}

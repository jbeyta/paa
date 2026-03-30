import { useRef, useState, useEffect } from 'react';
import { type AudioFile } from '../lib/api';
import styles from './AudioPlayer.module.scss';

interface AudioPlayerProps {
  file: AudioFile | null;
  isSticky: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="5" y="3" width="4" height="18" />
      <rect x="15" y="3" width="4" height="18" />
    </svg>
  );
}

export function AudioPlayer({ file, isSticky }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isSeeking = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (file) {
      audio.src = file.file_url;
      audio.load();
    } else {
      audio.removeAttribute('src');
    }
  }, [file]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !file) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleTimeUpdate = () => {
    if (isSeeking.current) return;
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration ?? 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleScrubStart = () => { isSeeking.current = true; };
  const handleScrubEnd = () => { isSeeking.current = false; };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const scrubProps = {
    type: 'range' as const,
    className: styles.scrubBar,
    style: { '--progress': `${progress}%` } as React.CSSProperties,
    min: 0,
    max: duration || 100,
    step: 0.1,
    value: currentTime,
    onChange: handleScrubChange,
    onMouseDown: handleScrubStart,
    onMouseUp: handleScrubEnd,
    onTouchStart: handleScrubStart,
    onTouchEnd: handleScrubEnd,
    disabled: !file,
    'aria-label': 'Seek',
  };

  return (
    <div className={`${styles.player} ${isSticky ? styles.isSticky : ''}`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {/* Expanded layout — always in document flow for spacing */}
      <div className={styles.expanded}>
        <p className={styles.title}>
          {file?.title ?? '— Select a track —'}
        </p>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          disabled={!file}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className={styles.scrubRow}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <input {...scrubProps} />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Compact layout — fixed at top when sticky */}
      <div className={styles.compact}>
        <span className={styles.compactTitle}>{file?.title ?? '—'}</span>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          disabled={!file}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <input {...scrubProps} />
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

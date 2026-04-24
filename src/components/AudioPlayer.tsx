import { useRef, useState, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
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
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurferRef.current?.destroy();
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const mediaEl = document.createElement('audio');
    mediaEl.crossOrigin = 'anonymous';

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#d8d8d8',
      progressColor: '#2a2a2a',
      cursorColor: '#2a2a2a',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64,
      normalize: true,
      media: mediaEl,
      fetchParams: { mode: 'cors' },
    });

    if (file) {
      ws.load(file.file_url);
    }

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    ws.on('timeupdate', (time) => setCurrentTime(time));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [file]);

  const togglePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (duration > 0) wavesurferRef.current?.seekTo(value / duration);
    setCurrentTime(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const compactScrubProps = {
    type: 'range' as const,
    className: styles.scrubBar,
    style: { '--progress': `${progress}%` } as React.CSSProperties,
    min: 0,
    max: duration || 100,
    step: 0.1,
    value: currentTime,
    onChange: handleScrubChange,
    disabled: !isReady,
    'aria-label': 'Seek',
  };

  return (
    <div className={`${styles.player} ${isSticky ? styles.isSticky : ''}`}>
      {/* Expanded layout — always in document flow for spacing */}
      <div className={styles.expanded}>
        <p className={styles.title}>
          {file?.title ?? '— Select a track —'}
        </p>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          disabled={!isReady}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className={styles.waveformRow}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div ref={waveformRef} className={styles.waveform} />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Compact layout — fixed at top when sticky */}
      <div className={styles.compact}>
        <span className={styles.compactTitle}>{file?.title ?? '—'}</span>
        <button
          className={styles.playBtn}
          onClick={togglePlayPause}
          disabled={!isReady}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className={styles.time}>{formatTime(currentTime)}</span>
        <input {...compactScrubProps} />
        <span className={styles.time}>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

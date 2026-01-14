import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type AudioFile } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import styles from './AudioDetail.module.scss';

export function AudioDetail() {
  const { id } = useParams<{ id: string }>();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchAudioFile(id);
    }
  }, [id]);

  const fetchAudioFile = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;
      setAudioFile(data);
    } catch (error) {
      showToast('Failed to load audio file', 'error');
      console.error('Error fetching audio file:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!audioFile) {
    return (
      <div className={styles.notFound}>
        <p>Audio file not found.</p>
        <Link to="/" className={styles.backLink}>
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>
        ← Back to list
      </Link>
      <div className={styles.content}>
        <h1 className={styles.title}>{audioFile.title}</h1>
        <div className={styles.meta}>
          <span className={styles.duration}>
            Duration: {formatDuration(audioFile.duration)}
          </span>
          <span className={styles.date}>
            Uploaded: {formatDate(audioFile.created_at)}
          </span>
        </div>
        <audio controls className={styles.player} src={audioFile.file_url}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}

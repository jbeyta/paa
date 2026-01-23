import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, type AudioFile } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import styles from './AudioDetail.module.scss';

export function AudioDetail() {
  const { id } = useParams<{ id: string }>();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const handleDelete = async () => {
    if (!audioFile || !id) return;

    const confirmed = confirm('Are you sure you want to delete this audio file? This action cannot be undone.');
    
    if (!confirmed) return;

    setDeleting(true);

    try {
      // Extract filename from file_url
      const url = new URL(audioFile.file_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('audio')
        .remove([fileName]);

      if (storageError) {
        throw new Error('Failed to delete file from storage');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      showToast('Audio file deleted successfully', 'success');

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      showToast('Failed to delete audio file', 'error');
      console.error('Error deleting audio file:', error);
      setDeleting(false);
    }
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
        {user && user.id === audioFile.uploaded_by && (
          <div className={styles.actionButtons}>
            <Link to={`/audio/${id}/edit`} className="btn btn-primary">
              Edit
            </Link>
            <button 
              onClick={handleDelete} 
              disabled={deleting}
              className="btn btn-danger"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

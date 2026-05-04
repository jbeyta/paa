import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { type AudioFile, getAudioFile, deleteAudioFile } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AudioPlayer } from '../components/AudioPlayer';
import styles from './AudioDetail.module.scss';

export function AudioDetail() {
  const { id } = useParams<{ id: string }>();
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isPlayerSticky, setIsPlayerSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchAudioFile(id);
  }, [id]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsPlayerSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const fetchAudioFile = async (fileId: string) => {
    try {
      const data = await getAudioFile(fileId);
      setAudioFile(data);
    } catch (error) {
      showToast('Failed to load audio file', 'error');
      console.error('Error fetching audio file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!audioFile || !id) return;
    const confirmed = confirm('Are you sure you want to delete this audio file? This action cannot be undone.');
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAudioFile(id);
      showToast('Audio file deleted successfully', 'success');
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      showToast('Failed to delete audio file', 'error');
      console.error('Error deleting audio file:', error);
      setDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div ref={sentinelRef} />
      <AudioPlayer file={audioFile} isSticky={isPlayerSticky} />

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : !audioFile ? (
        <div className={styles.notFound}>
          <p>Audio file not found.</p>
          <Link to="/" className={styles.backLink}>← Back to list</Link>
        </div>
      ) : (
        <div className={styles.detail}>
          <Link to="/" className={styles.backLink}>← Back to list</Link>
          {audioFile.description && (
            <p className={styles.description}>{audioFile.description}</p>
          )}
          {user && user.id === audioFile.uploaded_by && (
            <div className={styles.actionButtons}>
              <Link to={`/audio/${id}/edit`} className="btn btn-primary">Edit</Link>
              <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

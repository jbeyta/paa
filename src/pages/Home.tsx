import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type AudioFile } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.scss';

export function Home() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('audioPageSize');
    return saved ? Number(saved) : 10;
  });
  const [totalCount, setTotalCount] = useState(0);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAudioFiles();
  }, [page, pageSize]);

  const fetchAudioFiles = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = page * pageSize - 1;

      const { data, error, count } = await supabase
        .from('audio_files')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setAudioFiles(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      showToast('Failed to load audio files', 'error');
      console.error('Error fetching audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    localStorage.setItem('audioPageSize', String(newSize));
    setPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {audioFiles.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎧</div>
          <p className={styles.emptyTitle}>No files found</p>
          <p className={styles.emptyText}>The archive is currently empty.</p>
          {user && (
            <Link to="/upload" className={styles.emptyLink}>
              UPLOAD THE FIRST FILE
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {audioFiles.map((file) => (
            <div key={file.id} className={styles.item}>
              <Link to={`/audio/${file.id}`} className={styles.name}>
                {file.title}
              </Link>
              <span className={styles.duration}>
                {formatDuration(file.duration)}
              </span>
              <audio controls className={styles.player} src={file.file_url}>
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
          </div>
          
          <div className={styles.paginationControls}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={styles.pageButton}
            >
              Previous
            </button>
            
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
          
          <div className={styles.pageSizeSelector}>
            <label htmlFor="pageSize">Per page:</label>
            <select
              id="pageSize"
              value={String(pageSize)}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

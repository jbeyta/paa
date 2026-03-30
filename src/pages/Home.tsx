import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { type AudioFile } from '../lib/api';
import { getAudioFiles, type AudioFilesResponse } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AudioPlayer } from '../components/AudioPlayer';
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
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isPlayerSticky, setIsPlayerSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAudioFiles();
  }, [page, pageSize]);

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

  const fetchAudioFiles = async () => {
    setLoading(true);
    try {
      const { data, totalCount }: AudioFilesResponse = await getAudioFiles(page, pageSize);
      setAudioFiles(data || []);
      setTotalCount(totalCount || 0);
    } catch (error) {
      showToast('Failed to load audio files', 'error');
      console.error('Error fetching audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    localStorage.setItem('audioPageSize', String(newSize));
    setPage(1);
  };

  return (
    <div className={styles.container}>
      <div ref={sentinelRef} />
      <AudioPlayer file={selectedFile} isSticky={isPlayerSticky} />

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : audioFiles.length === 0 ? (
        <div className={styles.empty}>
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
            <div
              key={file.id}
              className={`${styles.item} ${selectedFile?.id === file.id ? styles.active : ''}`}
            >
              <button
                className={styles.name}
                onClick={() => setSelectedFile(file)}
              >
                {file.title}
              </button>
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
              className="btn btn-outline"
            >
              Previous
            </button>
            
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="btn btn-outline"
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

import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent, DragEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, type AudioFile } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import styles from './Edit.module.scss';

export function Edit() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDuration, setNewDuration] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchAudioFile();
    }
  }, [id]);

  const fetchAudioFile = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setAudioFile(data);
      setTitle(data.title);
    } catch (error) {
      showToast('Failed to load audio file', 'error');
      console.error('Error fetching audio file:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const extractDuration = async (audioFile: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const objectUrl = URL.createObjectURL(audioFile);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(Math.round(audio.duration));
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio metadata'));
      });

      audio.src = objectUrl;
    });
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      showToast('Please select an audio file', 'error');
      return;
    }

    showToast('Uploading a new file will permanently delete the old one', 'info');
    setNewFile(selectedFile);

    try {
      const audioDuration = await extractDuration(selectedFile);
      setNewDuration(audioDuration);
    } catch (error) {
      showToast('Failed to extract audio duration', 'error');
      console.error('Error extracting duration:', error);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !id || !audioFile) {
      showToast('Please enter a title', 'error');
      return;
    }

    setSaving(true);

    try {
      let updateData: { title: string; file_url?: string; duration?: number } = { title: title.trim() };

      // If new file is selected, handle file replacement
      if (newFile && newDuration !== null) {
        // Upload new file
        const fileName = newFile.name;
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(fileName, newFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL for new file
        const { data: urlData } = supabase.storage
          .from('audio')
          .getPublicUrl(fileName);

        // Delete old file from storage
        const oldUrl = new URL(audioFile.file_url);
        const oldPathParts = oldUrl.pathname.split('/');
        const oldFileName = oldPathParts[oldPathParts.length - 1];

        await supabase.storage
          .from('audio')
          .remove([oldFileName]);

        // Update data with new file info
        updateData.file_url = urlData.publicUrl;
        updateData.duration = newDuration;
      }

      // Update database
      const { error } = await supabase
        .from('audio_files')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      showToast('Audio file updated successfully!', 'success');
      
      setTimeout(() => {
        navigate(`/audio/${id}`);
      }, 3000);
    } catch (error) {
      showToast('Failed to update audio file', 'error');
      console.error('Error updating audio file:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!audioFile) {
    return <div className={styles.container}>Audio file not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Edit Audio</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Replace Audio File
            </label>
            <div
              className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${newFile ? styles.hasFile : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                onChange={handleChange}
                className={styles.fileInput}
              />
              {newFile ? (
                <div className={styles.fileInfo}>
                  <p className={styles.fileName}>{newFile.name}</p>
                  {newDuration !== null && (
                    <p className={styles.fileDuration}>
                      Duration: {Math.floor(newDuration / 60)}:{(newDuration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              ) : (
                <div className={styles.dropzoneText}>
                  <p>Click to select a new audio file</p>
                  <p>or drag and drop here</p>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/audio/${id}`)}
              disabled={saving}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

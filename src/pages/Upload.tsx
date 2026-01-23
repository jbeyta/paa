import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import styles from './Upload.module.scss';

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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

    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension

    try {
      const audioDuration = await extractDuration(selectedFile);
      setDuration(audioDuration);
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

    if (!file || !title || duration === null || !user) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileName = file.name;
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      // Insert metadata into database
      const { error: dbError } = await supabase.from('audio_files').insert({
        title,
        file_url: urlData.publicUrl,
        duration,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      showToast('Audio file uploaded successfully!', 'success');
      navigate('/');
    } catch (error) {
      showToast('Failed to upload audio file', 'error');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Upload Audio</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div
            className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${
              file ? styles.hasFile : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={handleChange}
              className={styles.fileInput}
            />
            {file ? (
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{file.name}</p>
                {duration !== null && (
                  <p className={styles.fileDuration}>
                    Duration: {Math.floor(duration / 60)}:
                    {(duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.dropzoneText}>
                <p>Click to select or drag and drop an audio file</p>
              </div>
            )}
          </div>

          {file && (
            <div className={styles.field}>
              <label htmlFor="title" className={styles.label}>
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          )}

          {file && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !title || duration === null}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

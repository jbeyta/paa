import type { AudioFile } from './supabase';

const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

// ── Audio ───────────────────────────────────────────────────────────────────

export interface AudioFilesResponse {
  data: AudioFile[];
  totalCount: number;
}

export async function getAudioFiles(
  page: number,
  pageSize: number
): Promise<AudioFilesResponse> {
  return apiFetch<AudioFilesResponse>(`/audio?page=${page}&pageSize=${pageSize}`);
}

export async function getAudioFile(id: string): Promise<AudioFile> {
  return apiFetch<AudioFile>(`/audio/${id}`);
}

export async function createAudioFile(body: {
  title: string;
  file_url: string;
  duration: number;
  uploaded_by: string;
}): Promise<AudioFile> {
  return apiFetch<AudioFile>('/audio', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAudioFile(
  id: string,
  body: { title: string; file_url?: string; duration?: number }
): Promise<AudioFile> {
  return apiFetch<AudioFile>(`/audio/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteAudioFile(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/audio/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }
}

// ── Upload ──────────────────────────────────────────────────────────────────

export async function getUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  return apiFetch<{ uploadUrl: string; fileUrl: string }>('/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function uploadFileToS3(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status}`);
  }
}

// ── Reactions ───────────────────────────────────────────────────────────────

export interface Reaction {
  id: string;
  audio_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export async function getReactions(audioId: string): Promise<Reaction[]> {
  return apiFetch<Reaction[]>(`/audio/${audioId}/reactions`);
}

export async function addReaction(
  audioId: string,
  body: { user_id: string; reaction_type: string }
): Promise<Reaction> {
  return apiFetch<Reaction>(`/audio/${audioId}/reactions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeReaction(
  audioId: string,
  body: { user_id: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/audio/${audioId}/reactions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }
}

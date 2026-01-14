# Public Audio Archive

A minimal audio file uploading and sharing application built with Vite, React, TypeScript, and Supabase.

## Features

- 📤 Upload audio files (authenticated users only)
- 🎵 Public audio playback
- 🔐 Email magic link authentication
- 📱 Mobile-first responsive design
- ⚡ Fast and minimal

## Prerequisites

- Node.js v20.13.1 or higher
- npm v10.8.1 or higher
- Supabase account with:
  - Storage bucket named `audio` (configured as public)
  - Database table `audio_files`
  - Email authentication enabled

## Supabase Setup

### 1. Create the `audio_files` table

Run this SQL in your Supabase SQL Editor:

```sql
create table public.audio_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  duration integer not null,
  created_at timestamp with time zone default now(),
  uploaded_by uuid references auth.users(id)
);
```

### 2. Set up Row Level Security (RLS) policies

```sql
-- Enable RLS
alter table public.audio_files enable row level security;

-- Allow anyone to read audio files
create policy "Public read access"
  on public.audio_files
  for select
  using (true);

-- Allow authenticated users to insert
create policy "Authenticated users can insert"
  on public.audio_files
  for insert
  to authenticated
  with check (auth.uid() = uploaded_by);
```

### 3. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `audio`
3. Set it as **public**
4. Add a policy to allow public reads:

```sql
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'audio');
```

5. Add a policy to allow authenticated uploads:

```sql
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio');
```

### 4. Enable Email Authentication

1. Go to Authentication → Providers in Supabase
2. Enable Email provider
3. Enable Magic Link (OTP) authentication

## Installation

1. Clone the repository and navigate to the project directory:

```bash
cd /Users/joelabeyta/Projects/PAA/app
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Running Locally

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### For Listeners (No Auth Required)

- Visit the home page to see all uploaded audio files
- Click on any file to play it
- Click a title to see the full-page view

### For Uploaders (Auth Required)

1. Click "Sign In" in the header
2. Enter your email
3. Check your email for the magic link
4. Click the magic link to authenticate
5. You'll be redirected to the upload page
6. Drag and drop or click to select an audio file
7. Edit the title if needed
8. Click "Upload"

## Project Structure

```
src/
├── components/         # Reusable components
│   ├── Header.tsx
│   └── ProtectedRoute.tsx
├── context/           # React context providers
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── lib/               # Utilities and config
│   └── supabase.ts
├── pages/             # Page components
│   ├── Home.tsx
│   ├── AudioDetail.tsx
│   ├── Login.tsx
│   └── Upload.tsx
├── App.tsx            # Main app component
└── App.scss           # Global styles
```

## Technologies

- **Vite** - Build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Supabase** - Backend (auth, storage, database)
- **SCSS Modules** - Styling

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

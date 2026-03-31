# Public Audio Archive

A minimal audio file uploading and sharing application built with Vite, React, TypeScript, and AWS.

## Features

- 📤 Upload audio files (authenticated users only)
- 🎵 Public audio playback
- 🔐 Email/password authentication via Cognito
- 📱 Mobile-first responsive design
- ⚡ Fast and minimal

## Prerequisites

- Node.js v20.13.1 or higher
- npm v10.8.1 or higher
- AWS infrastructure provisioned (see `infra/`)

## Installation

1. Clone the repository and navigate to the project directory:

```bash
cd /Users/joelabeyta/Projects/PAA/app
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and populate it with your AWS resource values:

```
VITE_API_URL=your-api-gateway-url
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-cognito-client-id
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
2. Enter your email and password
3. You'll be redirected to the upload page
4. Drag and drop or click to select an audio file
5. Edit the title if needed
6. Click "Upload"

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
│   ├── api.ts
│   └── auth.ts
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
- **AWS Cognito** - Authentication
- **AWS API Gateway + Lambda** - Backend API
- **AWS S3** - Audio file storage
- **AWS DynamoDB** - Database
- **SCSS Modules** - Styling

## License

MIT

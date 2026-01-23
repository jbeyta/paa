import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header.tsx';
import { Home } from './pages/Home.tsx';
import { AudioDetail } from './pages/AudioDetail.tsx';
import { Login } from './pages/Login.tsx';
import { Upload } from './pages/Upload.tsx';
import { Edit } from './pages/Edit.tsx';
import './App.scss';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Header />
            <main className="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/audio/:id" element={<AudioDetail />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <Upload />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audio/:id/edit"
                  element={
                    <ProtectedRoute>
                      <Edit />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

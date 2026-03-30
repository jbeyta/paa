import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth';
import type { CognitoUser } from 'amazon-cognito-identity-js';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.scss';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pendingUser, setPendingUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/upload');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Please enter your email and password', 'error');
      return;
    }

    setLoading(true);

    try {
      await signIn(email, password);
      await refreshUser();
      navigate('/upload');
    } catch (err: unknown) {
      const error = err as { code?: string; user?: CognitoUser; message?: string };
      if (error.code === 'NEW_PASSWORD_REQUIRED' && error.user) {
        setPendingUser(error.user);
      } else {
        showToast(error.message ?? 'Sign in failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword || !pendingUser) return;

    setLoading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        pendingUser.completeNewPasswordChallenge(newPassword, {}, {
          onSuccess: () => resolve(),
          onFailure: (err) => reject(err),
        });
      });
      await refreshUser();
      navigate('/upload');
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message ?? 'Failed to set new password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pendingUser) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.description}>
            A new password is required for your account.
          </p>
          <form onSubmit={handleNewPassword} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                disabled={loading}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign In</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={styles.input}
              disabled={loading}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

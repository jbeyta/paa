import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          Public Audio Archive
        </Link>
        <nav className={styles.nav}>
          {user ? (
            <>
              <span className={styles.user}>USER: {user.email?.split('@')[0].toUpperCase()}</span>
              <Link to="/upload" className={styles.uploadButton}>
                ↑ UPLOAD
              </Link>
              <button onClick={handleSignOut} className={styles.signOut}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className={styles.link}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

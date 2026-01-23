import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import logo from '../assets/images/paa.png';

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
          <img src={logo} alt="Public Audio Archive" className={styles.logoImage} />
        </Link>
        <nav className={styles.nav}>
          {user ? (
            <>
              <Link to="/upload" className="btn btn-primary">
                ↑ UPLOAD
              </Link>
              <span className={styles.user}>{user.email?.split('@')[0].toUpperCase()}</span>
              <button onClick={handleSignOut} className="btn btn-text">
                →
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

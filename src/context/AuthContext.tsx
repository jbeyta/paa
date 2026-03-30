import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentSession, signOut as cognitoSignOut } from '../lib/auth';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseUserFromToken(jwt: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session) {
        setUser(parseUserFromToken(session.getIdToken().getJwtToken()));
      }
      setLoading(false);
    });
  }, []);

  const refreshUser = async () => {
    const session = await getCurrentSession();
    setUser(session ? parseUserFromToken(session.getIdToken().getJwtToken()) : null);
  };

  const signOut = async () => {
    cognitoSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

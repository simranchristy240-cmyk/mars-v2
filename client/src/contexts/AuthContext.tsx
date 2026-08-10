import React, { createContext, useContext, useEffect, useState } from 'react';
import { IUser } from '@mars/shared';
import api from '../services/api';
import { logoutFirebase } from '../services/firebase';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  loginWithToken: (idToken: string, userData?: Partial<IUser>) => Promise<IUser>;
  loginWithPassword: (username: string, password: string) => Promise<IUser>;
  loginAsDemoNewStudent: () => Promise<IUser>;
  loginAsDemoStudent: () => Promise<IUser>;
  loginAsDemoAdmin: () => Promise<IUser>;
  logout: () => void;
  updateUser: (data: Partial<IUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loginWithToken = async (idToken: string, userData?: Partial<IUser>): Promise<IUser> => {
    localStorage.setItem('mars_auth_token', idToken);
    const sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem('mars_session_id', sessionId);

    const res = await api.post('/auth/sync', {
      ...userData,
      sessionId,
    });

    if (res.data.success) {
      setUser(res.data.data);
      return res.data.data;
    }
    throw new Error(res.data.error || 'Failed to authenticate');
  };

  const loginWithPassword = async (username: string, password: string): Promise<IUser> => {
    const sessionId = Math.random().toString(36).substring(2);
    const res = await api.post('/auth/login', { username, password, sessionId });

    if (!res.data.success) {
      throw new Error(res.data.error || 'Login failed');
    }

    const { token, sessionId: serverSessionId, user: loggedInUser } = res.data.data;
    localStorage.setItem('mars_auth_token', token);
    localStorage.setItem('mars_session_id', serverSessionId || sessionId);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const loginAsDemoNewStudent = async (): Promise<IUser> => {
    return await loginWithPassword('newstudent', 'mars123');
  };

  const loginAsDemoStudent = async (): Promise<IUser> => {
    return await loginWithPassword('student', 'mars123');
  };

  const loginAsDemoAdmin = async (): Promise<IUser> => {
    return await loginWithPassword('admin', 'mars123');
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('mars_auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        localStorage.removeItem('mars_auth_token');
        localStorage.removeItem('mars_session_id');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('mars_auth_token');
      localStorage.removeItem('mars_session_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('mars_auth_token');
    localStorage.removeItem('mars_session_id');
    logoutFirebase();
    setUser(null);
  };

  const updateUser = (data: Partial<IUser>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithToken,
        loginWithPassword,
        loginAsDemoNewStudent,
        loginAsDemoStudent,
        loginAsDemoAdmin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

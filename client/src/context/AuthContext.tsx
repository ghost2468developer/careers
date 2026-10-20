import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AUTH_OPERATIONS,
  getStoredToken,
  graphqlRequest,
  setStoredToken,
  User,
} from '../lib/graphql';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  updateUserState: (user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await graphqlRequest<{ me: User | null }>(AUTH_OPERATIONS.ME);
      if (data.me) {
        setUser(data.me);
      } else {
        setStoredToken(null);
        setUser(null);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setSession = (token: string, loggedInUser: User) => {
    setStoredToken(token);
    setUser(loggedInUser);
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setSession,
        updateUserState,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

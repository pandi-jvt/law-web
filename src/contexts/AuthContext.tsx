/**
 * Authentication context for managing user state across the application.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccountType, User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    accountName: string,
    accountType: AccountType,
    groupName: string | undefined,
    email: string,
    username: string,
    fullName: string,
    password: string,
    phoneNumber?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          apiService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    await apiService.login({ username, password });
    const currentUser = await apiService.getCurrentUser();
    setUser(currentUser);
  };

  const register = async (
    accountName: string,
    accountType: AccountType,
    groupName: string | undefined,
    email: string,
    username: string,
    fullName: string,
    password: string,
    phoneNumber?: string
  ) => {
    await apiService.register({
      account_name: accountName,
      account_type: accountType,
      group_name: groupName || undefined,
      email,
      username,
      full_name: fullName,
      password,
      phone_number: phoneNumber || undefined,
    });
    await login(username, password);
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (apiService.isAuthenticated()) {
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch {
        apiService.logout();
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

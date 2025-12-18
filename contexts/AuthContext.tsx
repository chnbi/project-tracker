import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { storage } from '../utils/storage';

const AUTH_KEY = 'minusone_auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = storage.get<User | null>(AUTH_KEY, null);
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (name: string, email: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email
    };
    setUser(newUser);
    storage.set(AUTH_KEY, newUser);
  };

  const logout = () => {
    setUser(null);
    storage.remove(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

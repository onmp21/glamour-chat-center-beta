
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs max-w-xs">
        <div className="font-bold">Auth Debug:</div>
        <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
        {user && (
          <>
            <div>User: {user.name}</div>
            <div>Role: {user.role}</div>
            <div>ID: {user.id}</div>
          </>
        )}
      </div>
    );
  }

  return null;
};

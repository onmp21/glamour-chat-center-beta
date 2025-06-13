
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm border border-gray-600 shadow-lg z-50">
      <div className="font-bold text-yellow-400 mb-2">🔍 Auth Debug (Development)</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {isAuthenticated ? '✅ Autenticado' : '❌ Não autenticado'}
          </span>
        </div>
        {user && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-medium">Nome:</span>
              <span className="text-blue-400">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Usuário:</span>
              <span className="text-blue-400">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Role:</span>
              <span className="text-green-400">{user.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">ID:</span>
              <span className="text-gray-400 text-[10px]">{user.id}</span>
            </div>
          </>
        )}
        {!user && (
          <div className="text-gray-400 italic">Nenhum usuário logado</div>
        )}
      </div>
    </div>
  );
};

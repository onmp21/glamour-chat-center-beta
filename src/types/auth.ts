
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedTabs: string[];
  assignedCities: string[];
  createdAt: string;
}

export type UserRole = 'admin' | 'manager_external' | 'manager_store' | 'salesperson';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

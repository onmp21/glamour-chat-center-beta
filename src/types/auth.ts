
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'salesperson' | 'manager_external' | 'manager_store';
  is_active: boolean;
  assigned_cities: string[];
  assigned_tabs: string[];
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'salesperson' | 'manager_external' | 'manager_store';
  assigned_cities: string[];
  assigned_tabs: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedTabs: string[];
  assignedCities: string[];
  createdAt: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type UserRole = 'admin' | 'manager' | 'salesperson' | 'manager_external' | 'manager_store';

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

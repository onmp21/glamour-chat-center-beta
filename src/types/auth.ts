
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'salesperson';
  is_active: boolean;
  assigned_cities: string[];
  assigned_tabs: string[];
  created_at: string;
  updated_at: string;
  avatar_url?: string; // Add missing avatar_url property
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'salesperson';
  assigned_cities: string[];
  assigned_tabs: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

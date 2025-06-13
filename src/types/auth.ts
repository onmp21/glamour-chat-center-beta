
export type UserRole = 'admin' | 'salesperson' | 'manager_external' | 'manager_store';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedTabs: string[];
  assignedCities: string[];
  createdAt: string;
}

export interface DatabaseUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_tabs: string[];
  assigned_cities: string[];
  created_at: string;
  is_active: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

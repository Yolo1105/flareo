export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
} 
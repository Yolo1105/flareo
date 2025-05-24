export interface Contest {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  participants: number;
  prize: string;
  rules: string[];
} 
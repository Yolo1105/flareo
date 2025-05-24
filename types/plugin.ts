export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  rating: number;
  downloads: number;
  category: string;
  tags: string[];
  version: string;
  lastUpdated: string;
  imageUrl: string;
} 
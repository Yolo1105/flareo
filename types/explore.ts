export interface Explore {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
}

export interface ExplorePageProps {
  explores: Explore[];
  className?: string;
} 
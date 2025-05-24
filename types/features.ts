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

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  version: string;
  lastUpdated: string;
}

export interface ExplorePageProps {
  explores: Explore[];
  className?: string;
}

export interface PluginsPageProps {
  plugins: Plugin[];
  className?: string;
} 
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

// Plugin Types
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'breaking';
    description: string;
  }[];
}

export interface PluginDetailTabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
}

export interface SpecCategory {
  title: string;
  items: {
    name: string;
    value: string;
  }[];
}

// Tab Type
export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType;
  disabled?: boolean;
  count?: number;
} 
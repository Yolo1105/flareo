import { ReactNode, Context } from 'react';

export interface TabsContextType {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export interface BaseTabsProps {
  className?: string;
  children: ReactNode;
}

export interface TabsProps extends BaseTabsProps {
  defaultValue: string;
}

export interface TabsListProps extends BaseTabsProps {
  tabsContext?: Context<TabsContextType>;
}

export interface TabsTriggerProps extends BaseTabsProps {
  value: string;
  tabsContext?: Context<TabsContextType>;
}

export interface TabsContentProps extends BaseTabsProps {
  value: string;
  tabsContext?: Context<TabsContextType>;
} 
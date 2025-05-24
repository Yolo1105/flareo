"use client"

import React from 'react';
import {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsContextType
} from '@/types/tabs';

const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  // Create context to share active tab state
  const TabsContext = React.createContext<TabsContextType>({ activeTab, setActiveTab });
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              tabsContext: TabsContext
            });
          }
          return child;
        })}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList: React.FC<TabsListProps> = ({ className = '', children, tabsContext }) => {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            tabsContext
          });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children, tabsContext }) => {
  if (!tabsContext) return null;
  
  return (
    <tabsContext.Consumer>
      {({ activeTab, setActiveTab }) => (
        <button
          className={`px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
            activeTab === value 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-900'
          } ${className}`}
          onClick={() => setActiveTab(value)}
        >
          {children}
        </button>
      )}
    </tabsContext.Consumer>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children, tabsContext }) => {
  if (!tabsContext) return null;
  
  return (
    <tabsContext.Consumer>
      {({ activeTab }) => (
        <div className={`${activeTab === value ? 'block' : 'hidden'} ${className}`}>
          {children}
        </div>
      )}
    </tabsContext.Consumer>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };

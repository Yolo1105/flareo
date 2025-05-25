"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { type PluginDetailTabsProps, type Tab } from '@/types/features';

export function PluginDetailTabs({ tabs, children }: PluginDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      {/* 标签导航 */}
      <div className="border-b">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-3 font-medium text-sm transition-colors",
                "border-b-2 -mb-px",
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-gray-400">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 标签内容 */}
      <div className="py-6">
        {children[tabs.findIndex((tab) => tab.id === activeTab)]}
      </div>
    </div>
  );
} 
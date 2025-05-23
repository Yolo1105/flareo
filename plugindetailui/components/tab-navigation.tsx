"use client"

import { cn } from "@/lib/utils"

type TabType = "overview" | "guide" | "reviews" | "questions" | "changelog" | "specs"

interface TabNavigationProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: "overview", label: "概述" },
    { id: "guide", label: "使用指南" },
    { id: "reviews", label: "评价 (125)" },
    { id: "questions", label: "问答 (15)" },
    { id: "changelog", label: "更新日志" },
    { id: "specs", label: "技术规格" },
  ]

  return (
    <div className="border-b border-neutral-200 mb-6">
      <div className="flex gap-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "py-3 font-medium transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent",
            )}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

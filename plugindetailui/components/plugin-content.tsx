"use client"

import { useState } from "react"
import TabNavigation from "@/components/tab-navigation"
import OverviewTab from "@/components/tabs/overview-tab"
import GuideTab from "@/components/tabs/guide-tab"
import ReviewsTab from "@/components/tabs/reviews-tab"
import QuestionsTab from "@/components/tabs/questions-tab"
import ChangelogTab from "@/components/tabs/changelog-tab"
import SpecsTab from "@/components/tabs/specs-tab"
import Sidebar from "@/components/sidebar"

type TabType = "overview" | "guide" | "reviews" | "questions" | "changelog" | "specs"

export default function PluginContent() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  return (
    <div className="py-8 flex-grow">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow lg:w-3/4">
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="mt-6">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "guide" && <GuideTab />}
              {activeTab === "reviews" && <ReviewsTab />}
              {activeTab === "questions" && <QuestionsTab />}
              {activeTab === "changelog" && <ChangelogTab />}
              {activeTab === "specs" && <SpecsTab />}
            </div>
          </div>

          <Sidebar />
        </div>
      </div>
    </div>
  )
}

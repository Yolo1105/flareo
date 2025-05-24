"use client"
import { ArrowUp } from "lucide-react"
import { useState, useEffect } from "react"
import DeveloperDetail from "./DeveloperDetail"
import UserDetail from "./UserDetail"

interface ProfileDetailProps {
  role: "developer" | "user"
}

export default function ProfileDetail({ role }: ProfileDetailProps) {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="relative">
      {/* 详细内容区域 */}
      <div className="space-y-6">{role === "developer" ? <DeveloperDetail /> : <UserDetail />}</div>

      {/* 回到顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 z-40"
          aria-label="回到顶部"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

import { Suspense } from "react"
import CommunityHomePage from "@/src/pages/CommunityHomePage"

interface TagPageProps {
  params: {
    tag: string
  }
}

export default function TagPage({ params }: TagPageProps) {
  const decodedTag = decodeURIComponent(params.tag)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">标签: #{decodedTag}</h1>
          <p className="text-gray-600 mt-1">查看所有关于 "{decodedTag}" 的讨论</p>
        </div>

        {/* Filter indicator */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">正在显示标签 "#{decodedTag}" 的相关帖子</span>
            <a href="/community" className="text-blue-600 hover:text-blue-800 text-sm underline">
              清除筛选
            </a>
          </div>
        </div>

        <CommunityHomePage />
      </div>
    </Suspense>
  )
}

export async function generateMetadata({ params }: TagPageProps) {
  const decodedTag = decodeURIComponent(params.tag)
  return {
    title: `${decodedTag} - 标签讨论 | Plugin Platform Community`,
    description: `查看所有关于 ${decodedTag} 的讨论和问题`,
  }
}

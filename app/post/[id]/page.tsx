"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageSquare, Share2, Bookmark, AlertCircle } from "lucide-react"
import { type Post } from '@/types/post'

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(24)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [commentSort, setCommentSort] = useState("latest")
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState([]) // existing comments data
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Add this useEffect after the state declarations
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        setShowShareMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showShareMenu])

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    alert(isBookmarked ? "已取消收藏" : "已收藏")
  }

  const handleShare = async () => {
    try {
      // Check if Web Share API is supported and available
      if (navigator.share) {
        const shareData = {
          title: "如何使用数据分析插件处理大型CSV文件？",
          text: "我最近尝试使用数据分析插件处理一个5GB的CSV文件，但遇到了内存不足的问题...",
          url: window.location.href,
        }

        await navigator.share(shareData)
        return
      }
    } catch (error) {
      // If share fails, is cancelled, or not supported, show share menu
      console.log("Native share not available or failed:", error)
    }

    // Show custom share menu as fallback
    setShowShareMenu(!showShareMenu)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert("链接已复制到剪贴板")
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("链接已复制到剪贴板")
    }
    setShowShareMenu(false)
  }

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent("如何使用数据分析插件处理大型CSV文件？")

    let shareUrl = ""

    switch (platform) {
      case "weibo":
        shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`
        break
      case "qq":
        shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`
        break
      case "wechat":
        // WeChat sharing typically requires QR code or special handling
        copyToClipboard()
        alert("链接已复制，请在微信中粘贴分享")
        return
      default:
        copyToClipboard()
        return
    }

    window.open(shareUrl, "_blank", "width=600,height=400")
    setShowShareMenu(false)
  }

  const handleReport = () => {
    const reason = window.prompt("请选择举报原因：\n1. 垃圾信息\n2. 违法违规\n3. 虚假信息\n4. 其他")
    if (reason) {
      alert("举报已提交，我们会尽快处理")
    }
  }

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      // Add new comment logic here
      alert("评论已发布")
      setNewComment("")
    }
  }

  const handleTagClick = (tag: string) => {
    // Navigate to community page with tag filter
    window.location.href = `/community?tag=${encodeURIComponent(tag)}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="w-full lg:w-2/3">
          {/* Post Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">如何使用数据分析插件处理大型CSV文件？</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Author"
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span>李小华</span>
              </div>
              <span>•</span>
              <span>2023年5月20日</span>
              <span>•</span>
              <span>2小时前</span>
              <div className="ml-auto flex space-x-2">
                <div className="relative">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1" />
                    分享
                  </Button>

                  {showShareMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={copyToClipboard}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          📋 复制链接
                        </button>
                        <button
                          onClick={() => shareToSocial("weibo")}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          🔗 分享到微博
                        </button>
                        <button
                          onClick={() => shareToSocial("qq")}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          🐧 分享到QQ
                        </button>
                        <button
                          onClick={() => shareToSocial("wechat")}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          💬 分享到微信
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className={isBookmarked ? "text-blue-600 border-blue-600" : ""}
                >
                  <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
                  收藏
                </Button>
                <Button variant="outline" size="sm" onClick={handleReport}>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  举报
                </Button>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <p>
                  我最近尝试使用数据分析插件处理一个5GB的CSV文件，但遇到了内存不足的问题。有没有推荐的方法可以高效处理大型文件而不会导致系统崩溃？
                </p>
                <p>我尝试过分批处理，但似乎插件不支持断点续传。以下是我尝试过的方法：</p>
                <ul>
                  <li>将文件拆分为多个小文件，但这样很难保持数据的完整性</li>
                  <li>增加系统内存，但这只是临时解决方案</li>
                  <li>使用数据库导入数据，但这增加了额外的复杂性</li>
                </ul>
                <p>有没有更好的解决方案或者专门处理大型数据集的插件推荐？</p>

                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <img src="https://via.placeholder.com/40" alt="Explore Icon" className="w-10 h-10 rounded-md" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">数据分析助手</h3>
                      <p className="text-sm text-blue-700">强大的数据处理和可视化工具</p>
                      <div className="mt-1 flex items-center text-xs text-blue-600">
                        <span>{"★".repeat(5)}</span>
                        <span className="ml-1">5.0</span>
                        <span className="mx-2">•</span>
                        <span>1,240次使用</span>
                      </div>
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                          查看插件
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <button onClick={() => handleTagClick("数据分析")}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  >
                    数据分析
                  </Badge>
                </button>
                <button onClick={() => handleTagClick("CSV")}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  >
                    CSV
                  </Badge>
                </button>
                <button onClick={() => handleTagClick("大数据")}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  >
                    大数据
                  </Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Post Actions */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-blue-600 border-blue-600" : ""}
            >
              <ThumbsUp className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              评论
            </Button>
          </div>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>评论</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <textarea
                  className="w-full p-3 border rounded-md"
                  rows={3}
                  placeholder="写下你的评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                  <Button onClick={handleCommentSubmit}>发布评论</Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Comment items will be rendered here */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>相关插件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Related plugins will be rendered here */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

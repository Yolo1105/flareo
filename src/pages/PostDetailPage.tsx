"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageSquare, Share2, Bookmark, AlertCircle } from "lucide-react"

const PostDetailPage: React.FC = () => {
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
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  onClick={() => handleTagClick("数据分析")}
                >
                  数据分析
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  onClick={() => handleTagClick("性能优化")}
                >
                  性能优化
                </Badge>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                  onClick={() => handleTagClick("大文件处理")}
                >
                  大文件处理
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="flex space-x-4">
                  <Button
                    variant={isLiked ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-1 ${isLiked ? "text-blue-600" : ""}`}
                    onClick={handleLike}
                  >
                    <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    <span>点赞</span>
                    <span className="ml-1 text-gray-500">({likeCount})</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>评论</span>
                    <span className="ml-1 text-gray-500">(8)</span>
                  </Button>
                </div>
                <div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">已解决</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">评论 (8)</h2>
              <select
                className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={commentSort}
                onChange={(e) => setCommentSort(e.target.value)}
              >
                <option value="latest">最新</option>
                <option value="popular">最多赞</option>
                <option value="author">作者优先</option>
              </select>
            </div>

            {/* Comment Input */}
            <div className="mb-6">
              <div className="flex space-x-3">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Your Avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={handleCommentSubmit} disabled={!newComment.trim()}>
                      发表评论
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {/* Comment 1 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Commenter"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">张大明</h3>
                      <p className="text-sm text-gray-500">1小时前</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        我遇到过类似的问题，推荐你尝试"大数据处理器"插件，它专门针对大型CSV文件优化，使用流式处理方式，不会一次性加载整个文件到内存中。
                      </p>
                      <p className="mt-2">另外，你也可以考虑使用数据分析助手的高级版，它支持分块处理和断点续传功能。</p>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <button
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.preventDefault()
                          alert("点赞成功！")
                        }}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>12</span>
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.preventDefault()
                          alert("回复功能即将开放")
                        }}
                      >
                        回复
                      </button>
                    </div>

                    {/* Nested Reply */}
                    <div className="mt-4 ml-6 pl-6 border-l-2 border-gray-100">
                      <div className="flex space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt="Original Poster"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              李小华{" "}
                              <Badge variant="outline" className="ml-1 text-blue-600">
                                作者
                              </Badge>
                            </h3>
                            <p className="text-sm text-gray-500">30分钟前</p>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>谢谢推荐！我会尝试"大数据处理器"插件。请问高级版大概需要多少费用？</p>
                          </div>
                          <div className="mt-2 flex items-center space-x-4">
                            <button
                              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.preventDefault()
                                alert("点赞成功！")
                              }}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span>3</span>
                            </button>
                            <button
                              className="text-sm text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.preventDefault()
                                alert("回复功能即将开放")
                              }}
                            >
                              回复
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment 2 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Commenter"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        赵小红{" "}
                        <Badge variant="outline" className="ml-1 text-green-600">
                          插件开发者
                        </Badge>
                      </h3>
                      <p className="text-sm text-gray-500">2小时前</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        作为数据分析助手的开发者，我想告诉你我们正在开发新版本，将专门优化大文件处理能力。目前的解决方案是使用我们的命令行工具，它支持流式处理和断点续传。
                      </p>
                      <p className="mt-2">
                        你可以在我们的GitHub仓库找到这个工具：
                        <a href="#" className="text-blue-600 hover:underline">
                          github.com/data-analysis-helper/cli
                        </a>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      <button
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.preventDefault()
                          alert("点赞成功！")
                        }}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>18</span>
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.preventDefault()
                          alert("回复功能即将开放")
                        }}
                      >
                        回复
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button variant="outline">查看更多评论</Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/3">
          {/* Plugin Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">相关插件</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <img src="https://via.placeholder.com/40" alt="Explore Icon" className="w-10 h-10 rounded-md" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">数据分析助手</h3>
                    <p className="text-sm text-gray-500">强大的数据处理和可视化工具</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span>{"★".repeat(5)}</span>
                      <span className="ml-1">5.0</span>
                      <span className="mx-2">•</span>
                      <span>1,240次使用</span>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <Button size="sm" variant="outline">
                        查看详情
                      </Button>
                      <Button size="sm">一键部署</Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <img src="https://via.placeholder.com/40" alt="Plugin Icon" className="w-10 h-10 rounded-md" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">大数据处理器</h3>
                    <p className="text-sm text-gray-500">专为大型数据集优化的处理工具</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <span>
                        {"★".repeat(4)}
                        {"☆".repeat(1)}
                      </span>
                      <span className="ml-1">4.7</span>
                      <span className="mx-2">•</span>
                      <span>856次使用</span>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <Button size="sm" variant="outline">
                        查看详情
                      </Button>
                      <Button size="sm">一键部署</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">相关问题</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                <li>
                  <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    如何优化数据分析插件的内存使用？
                  </a>
                  <div className="mt-1 text-xs text-gray-500">5个回答 • 2天前</div>
                </li>
                <li>
                  <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    数据分析助手与Pandas的性能对比
                  </a>
                  <div className="mt-1 text-xs text-gray-500">12个回答 • 1周前</div>
                </li>
                <li>
                  <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    推荐几个处理时间序列数据的插件
                  </a>
                  <div className="mt-1 text-xs text-gray-500">8个回答 • 2周前</div>
                </li>
                <li>
                  <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    如何将CSV数据导入到数据库并使用插件分析？
                  </a>
                  <div className="mt-1 text-xs text-gray-500">6个回答 • 3周前</div>
                </li>
                <li>
                  <a href="#" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    数据分析插件的API使用教程
                  </a>
                  <div className="mt-1 text-xs text-gray-500">15个回答 • 1个月前</div>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                查看更多相关问题
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PostDetailPage

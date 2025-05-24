"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThumbsUp, MessageSquare, Clock, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface PostCardProps {
  title: string
  excerpt: string
  tags: string[]
  author: {
    name: string
    avatar: string
  }
  timeAgo: string
  likes: number
  comments: number
}

const PostCard: React.FC<PostCardProps> = ({ title, excerpt, tags, author, timeAgo, likes, comments }) => {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or tags
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("button") || e.target.closest("a") || e.target.closest(".tag-badge"))
    ) {
      return
    }

    router.push("/post/1")
  }

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    alert("点赞成功！")
  }

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push("/post/1#comments")
  }

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    window.location.href = `/community?tag=${encodeURIComponent(tag)}`
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold hover:text-blue-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-3">{excerpt}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 tag-badge"
              onClick={(e) => handleTagClick(e, tag)}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-3">
          <img src={author.avatar || "/placeholder.svg"} alt={author.name} className="w-6 h-6 rounded-full" />
          <span>{author.name}</span>
          <span>•</span>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center hover:text-blue-600 transition-colors" onClick={handleLikeClick}>
            <ThumbsUp className="h-4 w-4 mr-1" />
            {likes}
          </button>
          <button className="flex items-center hover:text-blue-600 transition-colors" onClick={handleCommentClick}>
            <MessageSquare className="h-4 w-4 mr-1" />
            {comments}
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}

interface TopicTagProps {
  name: string
  count: number
}

const TopicTag: React.FC<TopicTagProps> = ({ name, count }) => {
  const handleTagClick = (tag: string) => {
    // Update URL with tag filter
    const newUrl = `/community?tag=${encodeURIComponent(tag)}`
    window.history.pushState({}, "", newUrl)
    // You could also update the posts list based on the tag
    alert(`筛选标签: ${tag}`)
  }

  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleTagClick(name)}
    >
      <span className="text-gray-700">#{name}</span>
      <Badge variant="secondary" className="bg-gray-100">
        {count}
      </Badge>
    </div>
  )
}

interface PluginCardProps {
  name: string
  description: string
  icon: string
  rating: number
  usageCount: number
}

const PluginCard: React.FC<PluginCardProps> = ({ name, description, icon, rating, usageCount }) => {
  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <img src={icon || "/placeholder.svg"} alt={name} className="w-10 h-10 rounded-md" />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">{name}</h4>
        <p className="text-sm text-gray-500 line-clamp-1">{description}</p>
        <div className="flex items-center mt-1 text-xs text-gray-500">
          <div className="flex items-center">
            {"★".repeat(Math.floor(rating))}
            {"☆".repeat(5 - Math.floor(rating))}
            <span className="ml-1">{rating.toFixed(1)}</span>
          </div>
          <span className="mx-2">•</span>
          <span>{usageCount}次使用</span>
        </div>
      </div>
    </div>
  )
}

const CommunityHomePage: React.FC = () => {
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [showAllPlugins, setShowAllPlugins] = useState(false)
  const [sortOption, setSortOption] = useState("latest")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showPluginDropdown, setShowPluginDropdown] = useState(false)
  const [showCommentDropdown, setShowCommentDropdown] = useState(false)
  const [selectedPluginSort, setSelectedPluginSort] = useState("推荐")
  const [selectedCommentSort, setSelectedCommentSort] = useState("最多评论")

  // 更多话题标签
  const allTopicTags = [
    { name: "部署失败", count: 42 },
    { name: "插件推荐", count: 38 },
    { name: "性能优化", count: 27 },
    { name: "数据处理", count: 24 },
    { name: "API集成", count: 19 },
    { name: "文档翻译", count: 15 },
    { name: "自动化", count: 12 },
    { name: "安全问题", count: 10 },
    { name: "UI设计", count: 8 },
  ]

  // 显示的话题标签
  const displayedTopicTags = showAllTopics ? allTopicTags : allTopicTags.slice(0, 5)

  // 更多插件
  const allPlugins = [
    {
      name: "数据分析助手",
      description: "强大的数据处理和可视化工具",
      icon: "/placeholder.svg?height=40&width=40",
      rating: 4.8,
      usageCount: 1240,
    },
    {
      name: "智能翻译器",
      description: "支持50种语言的高精度翻译",
      icon: "/placeholder.svg?height=40&width=40",
      rating: 4.6,
      usageCount: 980,
    },
    {
      name: "图像增强工具",
      description: "一键优化图片质量和分辨率",
      icon: "/placeholder.svg?height=40&width=40",
      rating: 4.5,
      usageCount: 860,
    },
    {
      name: "代码审查助手",
      description: "自动检测代码问题并提供优化建议",
      icon: "/placeholder.svg?height=40&width=40",
      rating: 4.7,
      usageCount: 750,
    },
    {
      name: "文档生成器",
      description: "从代码自动生成完整文档",
      icon: "/placeholder.svg?height=40&width=40",
      rating: 4.4,
      usageCount: 620,
    },
  ]

  // 显示的插件
  const displayedPlugins = showAllPlugins ? allPlugins : allPlugins.slice(0, 3)

  const handlePluginSortChange = (sort: string) => {
    setSelectedPluginSort(sort)
    setShowPluginDropdown(false)
    // Implement plugin sorting logic here
  }

  const handleCommentSortChange = (sort: string) => {
    setSelectedCommentSort(sort)
    setShowCommentDropdown(false)
    // Implement comment sorting logic here
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPluginDropdown || showCommentDropdown) {
        setShowPluginDropdown(false)
        setShowCommentDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showPluginDropdown, showCommentDropdown])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-row gap-6 overflow-x-auto">
        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索社区内容..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">话题分类</option>
                  <option value="suggestions">功能建议</option>
                  <option value="troubleshooting">故障排查</option>
                  <option value="plugins">插件推荐</option>
                  <option value="tutorials">教程分享</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="relative">
                <select
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="latest">最新</option>
                  <option value="popular">热门</option>
                  <option value="comments">最多评论</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="questions">提问</TabsTrigger>
              <TabsTrigger value="suggestions">建议</TabsTrigger>
              <TabsTrigger value="tutorials">教程</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="space-y-4">
                <PostCard
                  title="如何使用数据分析插件处理大型CSV文件？"
                  excerpt="我最近尝试使用数据分析插件处理一个5GB的CSV文件，但遇到了内存不足的问题。有没有推荐的方法可以高效处理大型文件而不会导致系统崩溃？我尝试过分批处理，但似乎插件不支持断点续传..."
                  tags={["数据分析", "性能优化", "大文件处理"]}
                  author={{
                    name: "李小华",
                    avatar:
                      "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="2小时前"
                  likes={24}
                  comments={8}
                />

                <PostCard
                  title="建议：为图像处理插件添加批量处理功能"
                  excerpt="目前的图像处理插件只能一次处理一张图片，这对于需要处理大量图片的用户来说非常不便。建议添加批量处理功能，允许用户选择多张图片并应用相同的处理参数，这将大大提高工作效率..."
                  tags={["图像处理", "功能建议", "批量处理"]}
                  author={{
                    name: "张大明",
                    avatar:
                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="5小时前"
                  likes={36}
                  comments={12}
                />

                <PostCard
                  title="教程：如何将多个插件串联使用实现自动化工作流"
                  excerpt="在这篇教程中，我将分享如何将数据抓取、清洗和分析三个插件串联起来，实现完全自动化的数据处理工作流。这种方法可以大大减少手动操作，提高数据处理的效率和准确性..."
                  tags={["自动化", "工作流", "插件串联", "教程"]}
                  author={{
                    name: "王小明",
                    avatar:
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="1天前"
                  likes={85}
                  comments={23}
                />

                <PostCard
                  title="文本翻译插件在处理技术文档时的准确性问题"
                  excerpt="我发现文本翻译插件在处理含有大量技术术语的文档时，准确性明显下降。特别是对于编程相关的内容，很多专业术语被错误翻译，导致文档难以理解。有没有针对技术文档优化的翻译插件推荐？"
                  tags={["文本翻译", "技术文档", "准确性"]}
                  author={{
                    name: "赵小红",
                    avatar:
                      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="2天前"
                  likes={42}
                  comments={16}
                />
              </div>

              <div className="mt-6 flex justify-center">
                <Button variant="outline">加载更多</Button>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="mt-0">
              <div className="space-y-4">
                <PostCard
                  title="如何使用数据分析插件处理大型CSV文件？"
                  excerpt="我最近尝试使用数据分析插件处理一个5GB的CSV文件，但遇到了内存不足的问题。有没有推荐的方法可以高效处理大型文件而不会导致系统崩溃？我尝试过分批处理，但似乎插件不支持断点续传..."
                  tags={["数据分析", "性能优化", "大文件处理"]}
                  author={{
                    name: "李小华",
                    avatar:
                      "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="2小时前"
                  likes={24}
                  comments={8}
                />

                <PostCard
                  title="文本翻译插件在处理技术文档时的准确性问题"
                  excerpt="我发现文本翻译插件在处理含有大量技术术语的文档时，准确性明显下降。特别是对于编程相关的内容，很多专业术语被错误翻译，导致文档难以理解。有没有针对技术文档优化的翻译插件推荐？"
                  tags={["文本翻译", "技术文档", "准确性"]}
                  author={{
                    name: "赵小红",
                    avatar:
                      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="2天前"
                  likes={42}
                  comments={16}
                />
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-0">
              <div className="space-y-4">
                <PostCard
                  title="建议：为图像处理插件添加批量处理功能"
                  excerpt="目前的图像处理插件只能一次处理一张图片，这对于需要处理大量图片的用户来说非常不便。建议添加批量处理功能，允许用户选择多张图片并应用相同的处理参数，这将大大提高工作效率..."
                  tags={["图像处理", "功能建议", "批量处理"]}
                  author={{
                    name: "张大明",
                    avatar:
                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="5小时前"
                  likes={36}
                  comments={12}
                />
              </div>
            </TabsContent>

            <TabsContent value="tutorials" className="mt-0">
              <div className="space-y-4">
                <PostCard
                  title="教程：如何将多个插件串联使用实现自动化工作流"
                  excerpt="在这篇教程中，我将分享如何将数据抓取、清洗和分析三个插件串联起来，实现完全自动化的数据处理工作流。这种方法可以大大减少手动操作，提高数据处理的效率和准确性..."
                  tags={["自动化", "工作流", "插件串联", "教程"]}
                  author={{
                    name: "王小明",
                    avatar:
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  timeAgo="1天前"
                  likes={85}
                  comments={23}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="w-[560px] flex-shrink-0">
          {/* Create Post Button */}
          <div className="mb-6">
            <Link href="/create-post">
              <Button className="w-full" size="lg">
                发布新帖子
              </Button>
            </Link>
          </div>

          {/* Hot Topics */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">🎯 热门话题标签</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {displayedTopicTags.map((tag, index) => (
                  <TopicTag key={index} name={tag.name} count={tag.count} />
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-600"
                onClick={() => setShowAllTopics(!showAllTopics)}
              >
                {showAllTopics ? "收起话题" : "查看更多话题"}
              </Button>
            </CardFooter>
          </Card>

          {/* Popular Plugins */}
          <Card className="mb-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">🧩 热门插件推荐</CardTitle>
              <div className="relative">
                <button
                  onClick={() => setShowPluginDropdown(!showPluginDropdown)}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {selectedPluginSort}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {showPluginDropdown && (
                  <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {["推荐", "最新", "最热门", "评分最高"].map((option) => (
                        <button
                          key={option}
                          onClick={() => handlePluginSortChange(option)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardDescription>社区中讨论最多的插件</CardDescription>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {displayedPlugins.map((plugin, index) => (
                  <Link key={index} href={`/plugins/${plugin.name.replace(/\s+/g, "-").toLowerCase()}`}>
                    <PluginCard
                      name={plugin.name}
                      description={plugin.description}
                      icon={plugin.icon}
                      rating={plugin.rating}
                      usageCount={plugin.usageCount}
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-600"
                onClick={() => setShowAllPlugins(!showAllPlugins)}
              >
                {showAllPlugins ? "收起插件" : "浏览更多插件"}
              </Button>
            </CardFooter>
          </Card>

          {/* Community Stats */}
          <Card className="mb-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">💬 社区动态</CardTitle>
              <div className="relative">
                <button
                  onClick={() => setShowCommentDropdown(!showCommentDropdown)}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                >
                  {selectedCommentSort}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {showCommentDropdown && (
                  <div className="absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {["最多评论", "最新评论", "热门讨论"].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleCommentSortChange(option)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-2">
                  <Link href="/post/1" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    数据分析插件优化建议讨论火热进行中
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">32条新评论 • 10分钟前</div>
                </div>
                <div className="border-b border-gray-100 pb-2">
                  <Link href="/post/2" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    插件兼容性问题解决方案分享
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">18条新评论 • 30分钟前</div>
                </div>
                <div>
                  <Link href="/post/3" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    新手入门教程获得大量好评
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">25条新评论 • 1小时前</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">📊 社区数据</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">活跃用户</span>
                  <span className="font-medium">12,458</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总帖子数</span>
                  <span className="font-medium">35,842</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">本周新增</span>
                  <span className="font-medium text-green-600">+486</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">已解决问题</span>
                  <span className="font-medium">24,673</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CommunityHomePage

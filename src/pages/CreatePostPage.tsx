"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageIcon, Link, Code, List, Bold, Italic, Underline, X } from "lucide-react"

const CreatePostPage: React.FC = () => {
  const router = useRouter()
  const [selectedTags, setSelectedTags] = useState<string[]>(["数据分析", "性能优化", "大文件处理"])
  const [tagInput, setTagInput] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [postType, setPostType] = useState("question")
  const [relatedExplores, setRelatedExplores] = useState<string[]>([])

  const recommendedTags = ["CSV", "内存优化", "流式处理", "批量处理", "API集成", "文档处理"]

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  const handleRemoveExplore = (exploreToRemove: string) => {
    setRelatedExplores(relatedExplores.filter((explore) => explore !== exploreToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      handleAddTag(tagInput.trim())
      setTagInput("")
    }
  }

  const handleCancel = () => {
    if (title || content) {
      const confirmLeave = window.confirm("您有未保存的内容，确定要离开吗？")
      if (confirmLeave) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  const handleSaveDraft = () => {
    // 这里实现保存草稿的逻辑
    alert("草稿已保存")
  }

  const handlePreview = () => {
    // 这里实现预览功能
    alert("预览功能开发中...")
  }

  const handlePublish = () => {
    if (!title.trim()) {
      alert("请输入标题")
      return
    }
    if (!content.trim()) {
      alert("请输入正文内容")
      return
    }
    // 这里实现发布逻辑
    alert("发布成功！")
    router.push("/community")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">发布新帖子</h1>
            <p className="text-gray-600 mt-1">分享您的问题、建议或经验，与社区成员交流</p>
            <a href="#" className="text-blue-600 hover:underline text-sm">
              查看发帖指南
            </a>
          </div>
          <Button variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5 mr-1" />
            取消
          </Button>
        </div>

        {/* Post Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">帖子类型</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="radio"
                name="post-type"
                id="question"
                className="peer sr-only"
                checked={postType === "question"}
                onChange={() => setPostType("question")}
              />
              <label
                htmlFor="question"
                className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
              >
                <span className="text-2xl mb-1">🤔</span>
                <span className="font-medium">提问</span>
                <span className="text-xs text-gray-500">寻求帮助解决问题</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="radio"
                name="post-type"
                id="suggestion"
                className="peer sr-only"
                checked={postType === "suggestion"}
                onChange={() => setPostType("suggestion")}
              />
              <label
                htmlFor="suggestion"
                className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
              >
                <span className="text-2xl mb-1">💡</span>
                <span className="font-medium">建议</span>
                <span className="text-xs text-gray-500">提出功能改进建议</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="radio"
                name="post-type"
                id="tutorial"
                className="peer sr-only"
                checked={postType === "tutorial"}
                onChange={() => setPostType("tutorial")}
              />
              <label
                htmlFor="tutorial"
                className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
              >
                <span className="text-2xl mb-1">📚</span>
                <span className="font-medium">教程</span>
                <span className="text-xs text-gray-500">分享使用经验和技巧</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="radio"
                name="post-type"
                id="feedback"
                className="peer sr-only"
                checked={postType === "feedback"}
                onChange={() => setPostType("feedback")}
              />
              <label
                htmlFor="feedback"
                className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
              >
                <span className="text-2xl mb-1">📣</span>
                <span className="font-medium">反馈</span>
                <span className="text-xs text-gray-500">反馈使用体验或问题</span>
              </label>
            </div>
          </div>
        </div>

        {/* Plugin Reference */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            关联探索 <span className="text-gray-500 font-normal">(可选)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索探索名称..."
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedExplores.map((explore, index) => (
              <Badge key={index} className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
                {explore}
                <button className="ml-1 text-blue-600 hover:text-blue-800" onClick={() => handleRemoveExplore(explore)}>
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">关联相关探索可以帮助更多用户找到您的帖子</p>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            标题 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="简明扼要地描述您的问题或主题"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-sm text-gray-400">{title.length}/100</span>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            正文内容 <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-md shadow-sm overflow-hidden">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Underline className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Code className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <List className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <Button variant="ghost" size="sm" className="text-xs px-2">
                H1
              </Button>
              <Button variant="ghost" size="sm" className="text-xs px-2">
                H2
              </Button>
              <Button variant="ghost" size="sm" className="text-xs px-2">
                H3
              </Button>
              <div className="flex-1"></div>
              <Button variant="ghost" size="sm" className="text-xs">
                Markdown 语法
              </Button>
            </div>

            {/* Editor Area */}
            <textarea
              id="content"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述您的问题或内容，可使用Markdown格式"
              className="block w-full px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            ></textarea>

            {/* Editor Footer */}
            <div className="flex justify-between items-center p-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              <span>支持 Markdown 格式</span>
              <span>{content.length} 字</span>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            附件 <span className="text-gray-500 font-normal">(可选)</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>上传文件</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                </label>
                <p className="pl-1">或拖放文件到此处</p>
              </div>
              <p className="text-xs text-gray-500">支持图片、PDF、日志文件等，单个文件不超过10MB</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签 <span className="text-gray-500 font-normal">(可选)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="添加标签，按回车确认"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <Badge key={index} className="bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1">
                {tag}
                <button className="ml-1 text-gray-600 hover:text-gray-800" onClick={() => handleRemoveTag(tag)}>
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">推荐标签：</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {recommendedTags
                .filter((tag) => !selectedTags.includes(tag))
                .map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        {/* Related Explores */}
        <div className="related-explores">
          <h3 className="text-lg font-semibold mb-4">相关探索</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedExplores.map((exploreId) => (
              <div key={exploreId} className="explore-card">
                {/* Explore card content */}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button variant="outline" type="button" onClick={handlePreview}>
            预览
          </Button>
          <div className="space-x-3">
            <Button variant="outline" type="button" onClick={handleSaveDraft}>
              保存草稿
            </Button>
            <Button type="submit" onClick={handlePublish}>
              发布
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage

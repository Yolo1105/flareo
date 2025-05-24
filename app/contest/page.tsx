"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, User, ThumbsUp, MessageSquare, Share2 } from "lucide-react"
import { type Contest } from '@/types/contest'

interface ContestCardProps {
  title: string
  description: string
  image: string
  startDate: string
  endDate: string
  participants: number
  prizes: string[]
  status: "upcoming" | "active" | "ended"
}

const ContestCard: React.FC<ContestCardProps> = ({
  title,
  description,
  image,
  startDate,
  endDate,
  participants,
  prizes,
  status,
}) => {
  const statusColors = {
    upcoming: "bg-amber-100 text-amber-800",
    active: "bg-green-100 text-green-800",
    ended: "bg-gray-100 text-gray-800",
  }

  const statusLabels = {
    upcoming: "即将开始",
    active: "进行中",
    ended: "已结束",
  }

  return (
    <Card className="mb-6 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" />
        <Badge className={`absolute top-3 right-3 ${statusColors[status]}`}>{statusLabels[status]}</Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">开始: {startDate}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">结束: {endDate}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">参与: {participants}人</span>
          </div>
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
            <span className="text-gray-700">奖项: {prizes.length}个</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">奖励:</div>
          <div className="flex flex-wrap gap-2">
            {prizes.map((prize, index) => (
              <Badge key={index} className="bg-amber-50 text-amber-700 border border-amber-200">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"} {prize}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between border-t border-gray-100">
        {status === "active" && <Button>立即参与</Button>}
        {status === "upcoming" && <Button variant="outline">提醒我</Button>}
        {status === "ended" && <Button variant="outline">查看获奖作品</Button>}
        <Button variant="ghost">了解详情</Button>
      </CardFooter>
    </Card>
  )
}

interface SubmissionCardProps {
  title: string
  author: {
    name: string
    avatar: string
  }
  image: string
  description: string
  likes: number
  comments: number
  ranking?: number
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  title,
  author,
  image,
  description,
  likes,
  comments,
  ranking,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-40 object-cover" />
        {ranking && (
          <div
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor:
                ranking === 1 ? "#FFD700" : ranking === 2 ? "#C0C0C0" : ranking === 3 ? "#CD7F32" : "#6B7280",
            }}
          >
            {ranking}
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center space-x-2">
          <img src={author.avatar || "/placeholder.svg"} alt={author.name} className="w-6 h-6 rounded-full" />
          <span className="text-sm text-gray-700">{author.name}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between text-sm border-t border-gray-100">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{likes}</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{comments}</span>
          </button>
        </div>
        <button className="flex items-center text-gray-500 hover:text-gray-700">
          <Share2 className="h-4 w-4 mr-1" />
          <span>分享</span>
        </button>
      </CardFooter>
    </Card>
  )
}

export default function ContestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">极客演武场</h1>
        <p className="text-gray-600 mt-1">参与插件开发竞赛，展示您的创意和技术，赢取丰厚奖励</p>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="active">进行中</TabsTrigger>
            <TabsTrigger value="upcoming">即将开始</TabsTrigger>
            <TabsTrigger value="past">往期竞赛</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="AI辅助工具创新挑战赛"
                description="设计并开发创新的AI辅助工具插件，提升用户工作效率和创造力。参赛作品将由专业评委和社区用户共同评选。"
                image="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-05-01"
                endDate="2025-06-15"
                participants={128}
                prizes={["¥20,000", "¥10,000", "¥5,000", "¥2,000"]}
                status="active"
              />

              <ContestCard
                title="数据可视化创意大赛"
                description="打造创新的数据可视化插件，帮助用户更直观地理解和分析数据。要求美观实用，支持多种数据源和自定义配置。"
                image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-04-15"
                endDate="2025-05-30"
                participants={96}
                prizes={["¥15,000", "¥8,000", "¥3,000"]}
                status="active"
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">热门参赛作品</h2>
                <Button variant="outline">查看全部</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SubmissionCard
                  title="智能文档助手"
                  author={{
                    name: "王小明",
                    avatar:
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                  description="自动分析文档结构，提取关键信息，生成摘要，并提供智能编辑建议。"
                  likes={86}
                  comments={24}
                  ranking={1}
                />
                <SubmissionCard
                  title="多模态AI创作工具"
                  author={{
                    name: "李小华",
                    avatar:
                      "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                  description="结合文本、图像和音频生成能力，一站式创作多媒体内容。"
                  likes={72}
                  comments={18}
                  ranking={2}
                />
                <SubmissionCard
                  title="代码智能助手"
                  author={{
                    name: "张大明",
                    avatar:
                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                  description="实时代码分析、错误检测、性能优化建议，支持多种编程语言。"
                  likes={65}
                  comments={15}
                  ranking={3}
                />
                <SubmissionCard
                  title="智能数据分析平台"
                  author={{
                    name: "赵小红",
                    avatar:
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                  description="一站式数据分析解决方案，支持多种数据源，自动生成分析报告。"
                  likes={58}
                  comments={12}
                  ranking={4}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="AI图像生成大赛"
                description="开发创新的AI图像生成插件，探索图像生成的新可能。要求支持多种风格和自定义参数。"
                image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-06-01"
                endDate="2025-07-15"
                participants={0}
                prizes={["¥25,000", "¥12,000", "¥6,000"]}
                status="upcoming"
              />
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="首届插件开发大赛"
                description="Flareo平台首届插件开发大赛，探索插件生态的无限可能。"
                image="https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2024-01-01"
                endDate="2024-02-15"
                participants={256}
                prizes={["¥30,000", "¥15,000", "¥7,000"]}
                status="ended"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

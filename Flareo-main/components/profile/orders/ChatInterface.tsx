"use client"
import { useState, useRef, useEffect } from "react"
import { Send, Check, X, Paperclip, Smile } from "lucide-react"

interface ChatInterfaceProps {
  orderId: string
  requesterName: string
  orderStatus: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  type: "text" | "system" | "action"
}

export default function ChatInterface({ orderId, requesterName, orderStatus }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "system",
      senderName: "系统",
      content: "订单已创建，请与需求方沟通具体细节",
      timestamp: "2025-05-20T10:00:00Z",
      type: "system",
    },
    {
      id: "2",
      senderId: "alice123",
      senderName: "Alice Chen",
      content: "你好！我需要一个PDF转Word的插件，能够保持原有格式。你觉得这个需求可以实现吗？",
      timestamp: "2025-05-20T10:05:00Z",
      type: "text",
    },
    {
      id: "3",
      senderId: "alice123",
      senderName: "Alice Chen",
      content: "另外，我希望能够批量处理文件，这样可以提高工作效率。",
      timestamp: "2025-05-20T10:06:00Z",
      type: "text",
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = "developer123" // 当前开发者ID

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSubmitting) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: "Mohan Lu",
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setIsSubmitting(true)

    // 模拟发送消息
    setTimeout(() => {
      setIsSubmitting(false)
    }, 1000)
  }

  const handleAcceptOrder = async () => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      senderId: "system",
      senderName: "系统",
      content: "开发者已接受此订单",
      timestamp: new Date().toISOString(),
      type: "system",
    }
    setMessages((prev) => [...prev, actionMessage])
  }

  const handleRejectOrder = async () => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      senderId: "system",
      senderName: "系统",
      content: "开发者已拒绝此订单",
      timestamp: new Date().toISOString(),
      type: "system",
    }
    setMessages((prev) => [...prev, actionMessage])
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-[600px] flex flex-col">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">{requesterName.charAt(0)}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">与 {requesterName} 的对话</h3>
            <p className="text-sm text-gray-500">订单 #{orderId}</p>
          </div>
        </div>

        {/* 操作按钮 */}
        {orderStatus === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleAcceptOrder}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
            >
              <Check className="w-4 h-4" />
              接受订单
            </button>
            <button
              onClick={handleRejectOrder}
              className="inline-flex items-center gap-1 px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              拒绝订单
            </button>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "system" ? (
              <div className="text-center">
                <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {message.content}
                </span>
                <div className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</div>
              </div>
            ) : (
              <div className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${message.senderId === currentUserId ? "order-2" : "order-1"}`}>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div
                    className={`text-xs text-gray-400 mt-1 ${
                      message.senderId === currentUserId ? "text-right" : "text-left"
                    }`}
                  >
                    {message.senderName} • {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 消息输入框 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="输入消息..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-1">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSubmitting}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

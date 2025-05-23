import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReviewItem from "@/components/review-item"

export default function ReviewsTab() {
  const reviews = [
    {
      id: 1,
      author: "用户A",
      rating: 5,
      date: "2天前",
      content: "非常棒的工具包！功能强大且易于使用，文档也很清晰。大大提高了我们的开发效率。",
      developerReply: {
        content: "感谢您的评价！我们很高兴能帮助到您。",
        date: "1天前",
      },
    },
    {
      id: 2,
      author: "用户B",
      rating: 4,
      date: "1周前",
      content: "整体不错，但在处理超大数据量时性能有待提高。希望未来版本能优化。",
    },
    {
      id: 3,
      author: "用户C",
      rating: 5,
      date: "2周前",
      content:
        "这是我用过的最好的数据可视化工具之一。API设计非常直观，文档详尽，示例丰富。强烈推荐给需要快速实现数据可视化的团队。",
    },
  ]

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-neutral-800">4.2</div>
          <div className="flex justify-center text-amber-500 my-1">
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 text-neutral-200" />
          </div>
          <div className="text-sm text-neutral-600">共 125 条评价</div>
        </div>

        <div className="flex-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-right w-5 text-sm text-neutral-600">5</span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "60%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-right w-5 text-sm text-neutral-600">4</span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-right w-5 text-sm text-neutral-600">3</span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "8%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-right w-5 text-sm text-neutral-600">2</span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "4%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-right w-5 text-sm text-neutral-600">1</span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "3%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-semibold">用户评价</h3>
        <Button className="bg-indigo-600 hover:bg-indigo-700">撰写评价</Button>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

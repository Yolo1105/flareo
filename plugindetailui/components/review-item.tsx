import { Star } from "lucide-react"

interface ReviewItemProps {
  review: {
    id: number
    author: string
    rating: number
    date: string
    content: string
    developerReply?: {
      content: string
      date: string
    }
  }
}

export default function ReviewItem({ review }: ReviewItemProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
          <span className="font-medium">{review.author}</span>
        </div>
        <div className="text-sm text-neutral-500">{review.date}</div>
      </div>

      <div className="flex text-amber-500 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-neutral-200"}`} />
        ))}
      </div>

      <div className="text-neutral-700 mb-3">{review.content}</div>

      {review.developerReply && (
        <div className="bg-neutral-50 border-l-3 border-indigo-600 p-3 mt-3 rounded-sm">
          <div className="font-medium text-indigo-800 mb-1">开发者回复</div>
          <p className="text-neutral-700">{review.developerReply.content}</p>
        </div>
      )}
    </div>
  )
}

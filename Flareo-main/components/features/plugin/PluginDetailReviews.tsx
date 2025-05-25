import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type Plugin } from '@/types/plugin';

interface Review {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  rating: number;
  content: string;
  date: string;
  reply?: {
    content: string;
    date: string;
  };
}

interface PluginDetailReviewsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  reviews: Review[];
}

export function PluginDetailReviews({
  averageRating,
  totalReviews,
  ratingDistribution,
  reviews,
}: PluginDetailReviewsProps) {
  return (
    <div className="space-y-8">
      {/* 评分概览 */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* 平均评分 */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center text-yellow-500 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(averageRating)
                      ? "fill-current"
                      : "fill-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-gray-600">共 {totalReviews} 条评价</div>
          </div>

          {/* 评分分布 */}
          <div className="flex-1">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2 mb-2">
                <div className="w-8 text-right text-sm text-gray-600">
                  {rating} 星
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-gray-600">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 评价列表 */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={review.author.avatar}
                  alt={review.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{review.author.name}</div>
                  <div className="text-sm text-gray-500">{review.date}</div>
                </div>
              </div>
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? "fill-current" : "fill-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-gray-700 mb-4">{review.content}</div>

            {review.reply && (
              <div className="bg-gray-50 border-l-4 border-primary pl-4 py-3 rounded-r">
                <div className="font-medium text-primary mb-1">开发者回复</div>
                <div className="text-gray-700">{review.reply.content}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {review.reply.date}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 
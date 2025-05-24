import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PluginDetailHeaderProps {
  plugin: {
    id: string;
    name: string;
    icon: string;
    developer: {
      name: string;
      avatar: string;
    };
    category: string;
    rating: number;
    reviewCount: number;
    installCount: number;
    version: string;
    updatedAt: string;
    tags: string[];
    price: number;
  };
}

export function PluginDetailHeader({ plugin }: PluginDetailHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="container py-8">
        <div className="flex gap-8">
          {/* 插件图标 */}
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <img
              src={plugin.icon}
              alt={plugin.name}
              className="max-w-[60px] max-h-[60px]"
            />
          </div>

          {/* 插件信息 */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{plugin.name}</h1>
            
            {/* 元信息 */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>
                  开发者:{" "}
                  <a href="#" className="text-primary hover:underline">
                    {plugin.developer.name}
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>分类: {plugin.category}</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(plugin.rating)
                          ? "fill-current"
                          : "fill-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-1 font-semibold text-gray-700">
                  {plugin.rating} ({plugin.reviewCount} 评价)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{plugin.installCount}+ 安装</span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4" />
                </svg>
                <span>版本: {plugin.version}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>更新于: {plugin.updatedAt}</span>
              </div>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {plugin.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 items-center">
              <span className="text-2xl font-semibold text-primary">
                ¥{plugin.price} / 月
              </span>
              <Button size="lg">立即订阅</Button>
              <Button variant="outline">免费试用</Button>
            </div>
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
} 
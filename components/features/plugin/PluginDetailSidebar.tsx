import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PricingOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface PluginDetailSidebarProps {
  pricingOptions: PricingOption[];
  developer: {
    name: string;
    avatar: string;
    website?: string;
  };
  onSelectPricing: (optionId: string) => void;
  selectedPricingId?: string;
}

export function PluginDetailSidebar({
  pricingOptions,
  developer,
  onSelectPricing,
  selectedPricingId,
}: PluginDetailSidebarProps) {
  return (
    <div className="space-y-6">
      {/* 价格方案 */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">价格方案</h3>
        <div className="space-y-3">
          {pricingOptions.map((option) => (
            <div
              key={option.id}
              className={`
                p-3 rounded-md border cursor-pointer transition-all
                ${
                  selectedPricingId === option.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50"
                }
              `}
              onClick={() => onSelectPricing(option.id)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{option.name}</span>
                <span className="text-primary font-semibold">
                  ¥{option.price}/月
                </span>
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4">立即订阅</Button>
      </Card>

      {/* 开发者信息 */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">开发者信息</h3>
        <div className="flex items-center gap-3">
          <img
            src={developer.avatar}
            alt={developer.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <div className="font-medium">{developer.name}</div>
            {developer.website && (
              <a
                href={developer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                访问官网
              </a>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 
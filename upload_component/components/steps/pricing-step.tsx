"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PricingOptionCard } from "@/components/pricing-option-card"

interface PricingStepProps {
  formData: any
  onChange: (field: string, value: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function PricingStep({ formData, onChange, onNext, onPrevious }: PricingStepProps) {
  const handlePricingModelChange = (model: string) => {
    onChange("pricingModel", model)
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    onChange(field, checked)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">设置定价与销售模式</h2>
      <p className="text-gray-600 mb-6">选择适合您插件的销售模式和定价策略，最大化您的收益。</p>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">销售模式</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <PricingOptionCard
            title="免费"
            description="免费提供给所有用户使用"
            isActive={formData.pricingModel === "free"}
            onClick={() => handlePricingModelChange("free")}
          />

          <PricingOptionCard
            title="一次性付费"
            description="用户支付一次费用后永久使用"
            isActive={formData.pricingModel === "one-time"}
            onClick={() => handlePricingModelChange("one-time")}
          />

          <PricingOptionCard
            title="订阅制"
            description="用户按月/年订阅使用"
            isActive={formData.pricingModel === "subscription"}
            onClick={() => handlePricingModelChange("subscription")}
          />

          <PricingOptionCard
            title="SLA增值服务"
            description="基础版免费，高级功能和支持付费"
            isActive={formData.pricingModel === "sla"}
            onClick={() => handlePricingModelChange("sla")}
          />

          <PricingOptionCard
            title="源码出售"
            description="出售插件源代码的完整所有权"
            isActive={formData.pricingModel === "source"}
            onClick={() => handlePricingModelChange("source")}
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">定价设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="price">价格 (¥)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              placeholder="0.00"
              disabled={formData.pricingModel === "free"}
              value={formData.price}
              onChange={(e) => onChange("price", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceCycle">计费周期</Label>
            <Select
              value={formData.priceCycle}
              onValueChange={(value) => onChange("priceCycle", value)}
              disabled={formData.pricingModel === "free" || formData.pricingModel === "one-time"}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择计费周期" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">一次性</SelectItem>
                <SelectItem value="monthly">每月</SelectItem>
                <SelectItem value="yearly">每年</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">试用设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableTrial"
              checked={formData.enableTrial}
              onCheckedChange={(checked) => handleSwitchChange("enableTrial", checked)}
              disabled={formData.pricingModel === "free"}
            />
            <Label htmlFor="enableTrial">启用免费试用</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialDays">试用天数</Label>
            <Input
              id="trialDays"
              name="trialDays"
              type="number"
              value={formData.trialDays}
              onChange={(e) => onChange("trialDays", e.target.value)}
              disabled={!formData.enableTrial || formData.pricingModel === "free"}
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">促销设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enablePromotion"
              checked={formData.enablePromotion}
              onCheckedChange={(checked) => handleSwitchChange("enablePromotion", checked)}
              disabled={formData.pricingModel === "free"}
            />
            <Label htmlFor="enablePromotion">启用促销价格</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotionPrice">促销价格 (¥)</Label>
            <Input
              id="promotionPrice"
              name="promotionPrice"
              type="number"
              placeholder="0.00"
              value={formData.promotionPrice}
              onChange={(e) => onChange("promotionPrice", e.target.value)}
              disabled={!formData.enablePromotion || formData.pricingModel === "free"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="promotionStart">促销开始日期</Label>
            <Input
              id="promotionStart"
              name="promotionStart"
              type="date"
              value={formData.promotionStart}
              onChange={(e) => onChange("promotionStart", e.target.value)}
              disabled={!formData.enablePromotion || formData.pricingModel === "free"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotionEnd">促销结束日期</Label>
            <Input
              id="promotionEnd"
              name="promotionEnd"
              type="date"
              value={formData.promotionEnd}
              onChange={(e) => onChange("promotionEnd", e.target.value)}
              disabled={!formData.enablePromotion || formData.pricingModel === "free"}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={onPrevious}>
            上一步
          </Button>
          <Button variant="outline">保存草稿</Button>
        </div>
        <Button onClick={onNext}>下一步：发布确认</Button>
      </div>
    </div>
  )
}

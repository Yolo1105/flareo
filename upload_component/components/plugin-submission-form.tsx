"use client"

import { useState } from "react"
import { StepIndicator } from "@/components/step-indicator"
import { UploadStep } from "@/components/steps/upload-step"
import { BasicInfoStep } from "@/components/steps/basic-info-step"
import { DeploymentStep } from "@/components/steps/deployment-step"
import { PricingStep } from "@/components/steps/pricing-step"
import { PublishStep } from "@/components/steps/publish-step"

const steps = [
  { id: 1, label: "上传插件" },
  { id: 2, label: "基本信息" },
  { id: 3, label: "部署配置" },
  { id: 4, label: "定价与销售" },
  { id: 5, label: "发布确认" },
]

export function PluginSubmissionForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [maxCompletedStep, setMaxCompletedStep] = useState(1)
  const [formData, setFormData] = useState({
    uploadMethod: "dockerfile",
    pluginName: "",
    pluginId: "",
    description: "",
    tags: [],
    detailedDescription: "",
    screenshots: [],
    deploymentMethods: ["docker"],
    cpuRequest: "1",
    memoryRequest: "1024",
    portNumber: "8080",
    portProtocol: "http",
    pricingModel: "free",
    price: "",
    priceCycle: "one-time",
    enableTrial: false,
    trialDays: "14",
    enablePromotion: false,
    promotionPrice: "",
    promotionStart: "",
    promotionEnd: "",
    agreeTerms: false,
  })

  const handleNext = () => {
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setMaxCompletedStep(Math.max(maxCompletedStep, nextStep))
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleStepClick = (step: number) => {
    if (step <= maxCompletedStep) {
      setCurrentStep(step)
      window.scrollTo(0, 0)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">上传与发布插件</h1>
        <p className="text-gray-600">通过以下步骤完成插件的上传、配置和发布，让您的创意为更多用户所用。</p>
      </div>

      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        maxCompletedStep={maxCompletedStep}
        onStepClick={handleStepClick}
      />

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 md:p-8">
        {currentStep === 1 && <UploadStep formData={formData} onChange={handleChange} onNext={handleNext} />}

        {currentStep === 2 && (
          <BasicInfoStep formData={formData} onChange={handleChange} onNext={handleNext} onPrevious={handlePrevious} />
        )}

        {currentStep === 3 && (
          <DeploymentStep formData={formData} onChange={handleChange} onNext={handleNext} onPrevious={handlePrevious} />
        )}

        {currentStep === 4 && (
          <PricingStep formData={formData} onChange={handleChange} onNext={handleNext} onPrevious={handlePrevious} />
        )}

        {currentStep === 5 && <PublishStep formData={formData} onChange={handleChange} onPrevious={handlePrevious} />}
      </div>
    </div>
  )
}

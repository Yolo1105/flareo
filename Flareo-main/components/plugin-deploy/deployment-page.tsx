"use client"

import { useState } from "react"
import { StepIndicator } from "./step-indicator"
import { DeploymentMethodSelection } from "./deployment-method-selection"
import { ConfigurationForm } from "./configuration-form"
import { PreviewAndValidate } from "./preview-and-validate"
import { DeploymentExecution } from "./deployment-execution"
import { DeploymentComplete } from "./deployment-complete"
import type { DeploymentMethod, DeploymentConfig } from "@/lib/types/deployment"

export function DeploymentPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState<DeploymentMethod | null>(null)
  const [config, setConfig] = useState<DeploymentConfig>({
    basic: {
      name: "",
      version: "2.1.0",
      region: "",
      description: "",
    },
    env: [],
    advanced: {
      cacheTtl: "300",
      features: [],
    },
  })

  const handleNext = () => {
    // Only set config.api if a method is selected and it's 'api'
    if (currentStep === 0 && selectedMethod === "api") {
      setConfig((prev) => ({
        ...prev,
        api: {
          rateLimit: "100",
          timeout: "30",
          authMethod: "api-key",
          corsOrigins: "*",
        },
      }))
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleMethodSelect = (method: DeploymentMethod) => {
    setSelectedMethod(method)
  }

  const handleUpdateConfig = (section: keyof DeploymentConfig, data: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: data,
    }))
  }

  const handleComplete = () => {
    // 模拟部署完成后的配置更新
    setConfig((prev) => ({
      ...prev,
      api: {
        rateLimit: prev.api?.rateLimit || "100",
        timeout: prev.api?.timeout || "30",
        authMethod: prev.api?.authMethod || "api-key",
        corsOrigins: prev.api?.corsOrigins || "*",
        apiUrl: "https://api.example.com/v1",
        apiKey: "sk_test_123456789",
        docUrl: "https://docs.example.com",
      },
    }))
    setCurrentStep((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-8">
      <StepIndicator currentStep={currentStep} onStepClick={(step) => {
        if (step < currentStep) setCurrentStep(step)
      }} />
      <div className="mt-8">
        {currentStep === 0 && (
          <DeploymentMethodSelection
            selectedMethod={selectedMethod ?? undefined}
            onSelect={handleMethodSelect}
            onNext={handleNext}
          />
        )}
        {currentStep === 1 && selectedMethod && (
          <ConfigurationForm
            config={config}
            deploymentMethod={selectedMethod}
            onUpdateConfig={handleUpdateConfig}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && selectedMethod && (
          <PreviewAndValidate
            config={config}
            deploymentMethod={selectedMethod}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        )}
        {currentStep === 3 && selectedMethod && (
          <DeploymentExecution
            config={config}
            deploymentMethod={selectedMethod}
            onComplete={handleComplete}
          />
        )}
        {currentStep === 4 && selectedMethod && (
          <DeploymentComplete
            config={config}
            deploymentMethod={selectedMethod}
          />
        )}
      </div>
    </div>
  )
} 
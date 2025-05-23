import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PricingStepProps {
  formData: any
  onChange: (field: string, value: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function PricingStep({ formData, onChange, onNext, onPrevious }: PricingStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">This is a placeholder for the pricing step. Add your pricing and sales fields here.</div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 
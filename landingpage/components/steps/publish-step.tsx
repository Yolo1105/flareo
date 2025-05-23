import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PublishStepProps {
  formData: any
  onChange: (field: string, value: any) => void
  onPrevious: () => void
}

export function PublishStep({ formData, onChange, onPrevious }: PublishStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish Confirmation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">This is a placeholder for the publish step. Add your publish confirmation and summary here.</div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </CardContent>
    </Card>
  )
} 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface BasicInfoStepProps {
  formData: {
    pluginName: string
    pluginId: string
    description: string
    tags: string[]
    detailedDescription: string
  }
  onChange: (field: string, value: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function BasicInfoStep({ formData, onChange, onNext, onPrevious }: BasicInfoStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          <div className="space-y-2">
            <Label htmlFor="pluginName">Plugin Name</Label>
            <Input
              id="pluginName"
              value={formData.pluginName}
              onChange={(e) => onChange("pluginName", e.target.value)}
              placeholder="Enter your plugin name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pluginId">Plugin ID</Label>
            <Input
              id="pluginId"
              value={formData.pluginId}
              onChange={(e) => onChange("pluginId", e.target.value)}
              placeholder="Enter a unique plugin ID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Brief description of your plugin"
              rows={2}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detailedDescription">Detailed Description</Label>
            <Textarea
              id="detailedDescription"
              value={formData.detailedDescription}
              onChange={(e) => onChange("detailedDescription", e.target.value)}
              placeholder="Detailed description of your plugin's functionality"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onPrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
import { Card } from "@/components/ui/card";
import { type SpecCategory } from '@/types/features';

interface PluginDetailSpecsProps {
  categories: SpecCategory[];
}

export function PluginDetailSpecs({ categories }: PluginDetailSpecsProps) {
  return (
    <div className="space-y-8">
      {categories.map((category, index) => (
        <Card key={index} className="p-6">
          <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-sm text-gray-500">{item.name}</div>
                <div className="font-medium">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
} 
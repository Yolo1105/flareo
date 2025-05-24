import { Card } from "@/components/ui/card";

interface GuideSection {
  title: string;
  content: string;
  code?: string;
  language?: string;
}

interface PluginDetailGuideProps {
  sections: GuideSection[];
}

export function PluginDetailGuide({ sections }: PluginDetailGuideProps) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <Card key={index} className="p-6">
          <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">{section.content}</p>
            {section.code && (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">{section.code}</code>
              </pre>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
} 
import { Card } from "@/components/ui/card";
import { type ChangelogEntry } from '@/types/features';

interface PluginDetailChangelogProps {
  entries: ChangelogEntry[];
}

export function PluginDetailChangelog({ entries }: PluginDetailChangelogProps) {
  const getChangeTypeColor = (type: ChangelogEntry["changes"][0]["type"]) => {
    switch (type) {
      case "feature":
        return "bg-green-100 text-green-800";
      case "fix":
        return "bg-red-100 text-red-800";
      case "improvement":
        return "bg-blue-100 text-blue-800";
      case "breaking":
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getChangeTypeLabel = (type: ChangelogEntry["changes"][0]["type"]) => {
    switch (type) {
      case "feature":
        return "新功能";
      case "fix":
        return "修复";
      case "improvement":
        return "改进";
      case "breaking":
        return "破坏性更新";
    }
  };

  return (
    <div className="space-y-8">
      {entries.map((entry, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-xl font-semibold">v{entry.version}</div>
            <div className="text-gray-500">{entry.date}</div>
          </div>

          <div className="space-y-3">
            {entry.changes.map((change, changeIndex) => (
              <div key={changeIndex} className="flex items-start gap-3">
                <span
                  className={`px-2 py-1 rounded text-sm ${getChangeTypeColor(
                    change.type
                  )}`}
                >
                  {getChangeTypeLabel(change.type)}
                </span>
                <span className="text-gray-700">{change.description}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
} 
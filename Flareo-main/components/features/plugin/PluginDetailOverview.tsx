import { type Plugin } from '@/types/plugin';
import { PluginDetailGallery } from "./PluginDetailGallery";

interface PluginDetailOverviewProps {
  description: string;
  features: string[];
  useCases: string[];
  screenshots: {
    url: string;
    alt: string;
  }[];
}

export function PluginDetailOverview({
  description,
  features,
  useCases,
  screenshots,
}: PluginDetailOverviewProps) {
  return (
    <div className="prose max-w-none">
      {/* 插件描述 */}
      <h3 className="text-xl font-semibold mb-4">插件描述</h3>
      <p className="text-gray-700 mb-8">{description}</p>

      {/* 主要功能特点 */}
      <h3 className="text-xl font-semibold mb-4">主要功能特点</h3>
      <ul className="list-disc pl-6 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="text-gray-700 mb-2">
            {feature}
          </li>
        ))}
      </ul>

      {/* 截图与演示 */}
      <h3 className="text-xl font-semibold mb-4">截图与演示</h3>
      <div className="mb-8">
        <PluginDetailGallery screenshots={screenshots} />
      </div>

      {/* 使用场景 */}
      <h3 className="text-xl font-semibold mb-4">使用场景</h3>
      <p className="text-gray-700 mb-4">
        该工具包适用于各种需要数据可视化的场景，例如：
      </p>
      <ul className="list-disc pl-6">
        {useCases.map((useCase, index) => (
          <li key={index} className="text-gray-700 mb-2">
            {useCase}
          </li>
        ))}
      </ul>
    </div>
  );
} 
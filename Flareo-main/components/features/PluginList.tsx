"use client";

import { PluginCard } from "./PluginCard";
import { type Plugin } from '@/types/plugin';

interface PluginListProps {
  plugins: Plugin[];
  className?: string;
}

export function PluginList({ plugins, className }: PluginListProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}
      </div>
    </div>
  );
} 
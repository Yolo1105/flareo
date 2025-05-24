"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { type Plugin } from "@/lib/mock-data";

interface PluginCardProps {
  plugin: Plugin;
  className?: string;
}

export function PluginCard({ plugin, className }: PluginCardProps) {
  return (
    <Link href={`/plugins/${plugin.id}`} className="block">
      <Card className={cn("w-full overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]", className)}>
        <div className="relative h-48 w-full">
          <Image
            src={plugin.imageUrl}
            alt={plugin.name}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{plugin.name}</CardTitle>
            <span className="text-sm text-gray-500">v{plugin.version}</span>
          </div>
          <CardDescription>by {plugin.author}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {plugin.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="mr-1">⭐</span>
                {plugin.rating.toFixed(1)}
              </span>
              <span className="flex items-center">
                <span className="mr-1">📥</span>
                {plugin.downloads.toLocaleString()}
              </span>
            </div>
            <span>Updated {plugin.lastUpdated}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="default" className="flex-1">
            View Details
          </Button>
          <Button variant="outline" className="flex-1">
            Install
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
} 
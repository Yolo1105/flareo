"use client";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface Screenshot {
  url: string;
  alt: string;
}

interface PluginDetailGalleryProps {
  screenshots: Screenshot[];
}

export function PluginDetailGallery({ screenshots }: PluginDetailGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((screenshot, index) => (
          <div
            key={index}
            className="aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => setSelectedImage(screenshot)}
          >
            <Image
              src={screenshot.url}
              alt={screenshot.alt}
              width={400}
              height={225}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 
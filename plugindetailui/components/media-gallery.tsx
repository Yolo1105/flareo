import Image from "next/image"

interface MediaGalleryProps {
  images: {
    id: number
    src: string
    alt: string
  }[]
}

export default function MediaGallery({ images }: MediaGalleryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {images.map((image) => (
        <div
          key={image.id}
          className="aspect-video bg-neutral-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}

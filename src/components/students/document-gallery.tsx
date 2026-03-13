"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils/cn";

interface DocumentGalleryProps {
  images: {
    src: string;
    alt: string;
    title?: string;
  }[];
}

export function DocumentGallery({ images }: DocumentGalleryProps) {
  const [index, setIndex] = useState(-1);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Image Gallery</h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-primary/50 transition-all group"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {image.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs text-white truncate">{image.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        index={index}
        slides={images.map(img => ({ src: img.src, alt: img.alt }))}
        open={index >= 0}
        close={() => setIndex(-1)}
        carousel={{ finite: images.length <= 1 }}
        render={{
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
        }}
      />
    </div>
  );
}

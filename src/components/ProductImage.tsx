"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ProductImageProps } from "@/types/main";

export function ProductImage({ imageUrl, productName, className = "" }: ProductImageProps) {
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new window.Image();
    img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => setError(true);
    img.src = imageUrl;
  }, [imageUrl]);

  if (!imageUrl || error) {
    return (
      <div className={className}>
        <div className="bg-slate-100 rounded-lg flex items-center justify-center" style={{ height: '200px' }}>
          <div className="text-slate-400 text-sm">Нет фото</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="bg-slate-100 rounded-lg overflow-hidden" style={{ height: '200px' }}>
        <Image
          src={imageUrl}
          alt={productName || "Изображение товара"}
          width={dimensions?.width || 800}
          height={dimensions?.height || 600}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
          unoptimized
        />
      </div>
      {dimensions && (
        <div className="mt-2 text-center text-xs text-slate-500">
          {dimensions.width}×{dimensions.height} px
        </div>
      )}
    </div>
  );
}

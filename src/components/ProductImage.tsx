"use client";

import { useState } from "react";
import Image from "next/image";

type ProductImageProps = {
  imageUrl?: string | null;
  productName?: string | null;
  className?: string;
};

export function ProductImage({ imageUrl, productName, className = "" }: ProductImageProps) {
  const [error, setError] = useState(false);

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
          width={800}
          height={600}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
          unoptimized
        />
      </div>
    </div>
  );
}

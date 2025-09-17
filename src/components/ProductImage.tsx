"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProductImage } from "@/lib/pimApiClient";

type ProductImageProps = {
  productId: string | number;
  productName?: string | null;
  className?: string;
};

type ImageData = {
  url: string;
  width: number;
  height: number;
  type: string;
};

export function ProductImage({ productId, productName, className = "" }: ProductImageProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      
      try {
        console.log('[ProductImage] Загрузка изображения для товара:', productId);
        const data = await getProductImage(productId);
        setImageData(data);
      } catch (error) {
        console.error('[ProductImage] Ошибка загрузки изображения:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [productId]);

  if (loading) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="animate-pulse text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!imageData || error) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-slate-400 text-sm">Нет фото</div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <Image
        src={imageData.url}
        alt={productName || "Изображение товара"}
        width={imageData.width}
        height={imageData.height}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        unoptimized
      />
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {imageData.width}×{imageData.height} {imageData.type}
      </div>
    </div>
  );
}

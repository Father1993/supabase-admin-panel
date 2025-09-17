"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProductImage } from "@/lib/pimApiClient";
import { ProductImageProps, ImageData } from "@/types/main";



export function ProductImage({ productId, productName, className = "" }: ProductImageProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      console.log('🖼️ ProductImage: начинаем загрузку для товара', productId);
      setLoading(true);
      setError(false);
      
      try {
        const data = await getProductImage(productId);
        console.log('🖼️ ProductImage: получены данные изображения', data);
        setImageData(data);
        
        if (!data) {
          console.log('⚠️ ProductImage: данные изображения отсутствуют');
        }
      } catch (error) {
        console.log('❌ ProductImage: ошибка загрузки изображения', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [productId]);

  if (loading) {
    return (
      <div className={className}>
        <div className="bg-slate-100 rounded-lg flex items-center justify-center" style={{ height: '200px' }}>
          <div className="animate-pulse text-slate-400 text-sm">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!imageData || error) {
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
          src={imageData.url}
          alt={productName || "Изображение товара"}
          width={imageData.width}
          height={imageData.height}
          className="w-full h-full object-contain"
          onError={() => {
            console.log('❌ ProductImage: ошибка загрузки изображения по URL:', imageData.url);
            setError(true);
          }}
          unoptimized
        />
      </div>
      <div className="mt-2 text-center text-xs text-slate-500">
        {imageData.width}×{imageData.height} пикс. • {imageData.type}
      </div>
    </div>
  );
}

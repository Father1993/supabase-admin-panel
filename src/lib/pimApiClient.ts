"use client";

export async function getProductImage(productId: string | number): Promise<{url: string; width: number; height: number; type: string} | null> {
  try {
    const response = await fetch(`/api/pim-image?productId=${productId}`);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[PIM] Ошибка получения изображения товара:', error);
    return null;
  }
}



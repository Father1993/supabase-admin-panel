"use client";

let authToken: string | null = null;
let tokenExpiry: number = 0;

async function getPimAuthToken(): Promise<string | null> {
  const PIM_URL = process.env.NEXT_PUBLIC_PIM_URL;
  const PIM_LOGIN = process.env.NEXT_PUBLIC_PIM_LOGIN;
  const PIM_PASS = process.env.NEXT_PUBLIC_PIM_PASS;

  if (!PIM_URL || !PIM_LOGIN || !PIM_PASS) {
    return null;
  }

  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    const response = await fetch(`${PIM_URL}/sign-in/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: PIM_LOGIN,
        password: PIM_PASS,
        remember: true
      })
    });

    const data = await response.json();
    
    if (data.success && data.data?.access?.token) {
      authToken = data.data.access.token;
      tokenExpiry = Date.now() + 50 * 60 * 1000;
      return authToken;
    }
  } catch {
      console.log('Ошибка получения токена авторизации')
  }
  
  return null;
}

export async function getProductImage(productId: string | number): Promise<{url: string; width: number; height: number; type: string} | null> {
  const PIM_URL = process.env.NEXT_PUBLIC_PIM_URL;
  
  if (!PIM_URL) return null;

  const token = await getPimAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${PIM_URL}/product/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    const picture = data.data?.picture;
    const type = picture.type.toUpperCase();

    if (picture && picture.name) {
      return {
        url: `https://pim.uroven.pro/pictures/originals/${picture.name}.${type}`,
        width: picture.sizeX,
        height: picture.sizeY,
        type: picture.type
      };
    }
  } catch {
    console.log('Ошибка получения изображения товара:', productId)
  }
  
  return null;
}



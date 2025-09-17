"use client";

const login = process.env.NEXT_PUBLIC_PIM_LOGIN;
const pass = process.env.NEXT_PUBLIC_PIM_PASS;
const url = process.env.NEXT_PUBLIC_PIM_URL;

if (!login || !pass || !url) {
  console.warn(
    "[API PIM] Отсутствуют переменные окружения:",
    { login: !!login, pass: !!pass, url: !!url }
  );
}

let authToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string | null> {
  // Проверяем наличие переменных окружения
  if (!login || !pass || !url) {
    console.error('[PIM] Не заданы переменные окружения для PIM API');
    return null;
  }

  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

  try {
    console.log('[PIM] Авторизация в PIM API...');
    const response = await fetch(`${url}/sign-in/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login,
        password: pass,
        remember: true
      })
    });

    if (!response.ok) {
      console.error('[PIM] Ошибка HTTP:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data?.access?.token) {
      authToken = data.data.access.token;
      tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 минут
      console.log('[PIM] Авторизация успешна');
      return authToken;
    } else {
      console.error('[PIM] Неверный ответ API:', data);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[PIM] CORS ошибка - сервер PIM не разрешает запросы с localhost. Обратитесь к администратору PIM для настройки CORS.');
    } else {
      console.error('[PIM] Ошибка авторизации:', error);
    }
  }
  
  return null;
}

export async function getProductImage(productId: string | number): Promise<{url: string; width: number; height: number; type: string} | null> {
  const token = await getAuthToken();
  if (!token) {
    console.log('[PIM] Токен недоступен для получения изображения товара', productId);
    return null;
  }

  try {
    console.log('[PIM] Запрос изображения для товара:', productId);
    const response = await fetch(`${url}/product/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[PIM] Ошибка получения товара:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('[PIM] Ответ API для товара:', productId, data);
    
    const picture = data.data?.picture;
    
    if (picture && picture.name) {
      const imageData = {
        url: `${url}/file/${picture.name}`,
        width: picture.sizeX || 400,
        height: picture.sizeY || 300,
        type: picture.type || 'JPG'
      };
      console.log('[PIM] Данные изображения:', imageData);
      return imageData;
    } else {
      console.log('[PIM] Изображение не найдено для товара:', productId);
    }
  } catch (error) {
    console.error('[PIM] Ошибка получения изображения товара:', error);
  }
  
  return null;
}



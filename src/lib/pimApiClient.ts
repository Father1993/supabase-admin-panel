"use client";

let authToken: string | null = null;
let tokenExpiry: number = 0;

async function getPimAuthToken(): Promise<string | null> {
  const PIM_URL = process.env.NEXT_PUBLIC_PIM_URL;
  const PIM_LOGIN = process.env.NEXT_PUBLIC_PIM_LOGIN;
  const PIM_PASS = process.env.NEXT_PUBLIC_PIM_PASS;

  console.log('🔐 Получение токена авторизации...');
  console.log('🌐 URL:', PIM_URL);
  console.log('👤 LOGIN:', PIM_LOGIN ? 'Установлен' : 'Не установлен');
  console.log('🔒 PASS:', PIM_PASS ? 'Установлен' : 'Не установлен');

  if (!PIM_URL || !PIM_LOGIN || !PIM_PASS) {
    console.log('❌ Отсутствуют переменные окружения для PIM');
    return null;
  }

  if (authToken && Date.now() < tokenExpiry) {
    console.log('✅ Используем кэшированный токен');
    return authToken;
  }

  try {
    console.log('📡 Запрос авторизации к:', `${PIM_URL}/sign-in/`);
    const response = await fetch(`${PIM_URL}/sign-in/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: PIM_LOGIN,
        password: PIM_PASS,
        remember: true
      })
    });

    console.log('📊 Статус авторизации:', response.status);
    const data = await response.json();
    console.log('📄 Ответ авторизации:', data);
    
    if (data.success && data.data?.access?.token) {
      authToken = data.data.access.token;
      tokenExpiry = Date.now() + 50 * 60 * 1000;
      console.log('✅ Токен получен успешно');
      return authToken;
    } else {
      console.log('❌ Неуспешная авторизация');
    }
  } catch (error) {
      console.log('❌ Ошибка получения токена авторизации:', error);
  }
  
  return null;
}

export async function getProductImage(productId: string | number): Promise<{url: string; width: number; height: number; type: string} | null> {
  const PIM_URL = process.env.NEXT_PUBLIC_PIM_URL;
  console.log('🔍 Получение изображения для товара:', productId);
  console.log('🌐 PIM_URL:', PIM_URL);
  
  if (!PIM_URL) {
    console.log('❌ PIM_URL не установлен');
    return null;
  }

  const token = await getPimAuthToken();
  console.log('🔑 Токен получен:', token ? 'Да' : 'Нет');
  if (!token) return null;

  try {
    console.log('📡 Запрос к:', `${PIM_URL}/product/${productId}`);
    const response = await fetch(`${PIM_URL}/product/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Статус ответа:', response.status);
    const data = await response.json();
    console.log('📄 Данные ответа:', data);
    
    const picture = data.data?.picture;
    console.log('🖼️ Данные изображения:', picture);

    if (picture && picture.name) {
      const type = picture.type?.toUpperCase() || 'noType';
      const imageUrl = `https://pim.uroven.pro/pictures/originals/${picture.name}.${type}`;
      console.log('✅ Формируем URL изображения:', imageUrl);
      
      return {
        url: imageUrl,
        width: picture.sizeX || 400,
        height: picture.sizeY || 300,
        type: picture.type || 'noType'
      };
    } else {
      console.log('❌ У товара нет изображения или неверная структура данных');
    }
  } catch (error) {
    console.log('❌ Ошибка получения изображения товара:', productId, error);
  }
  
  return null;
}



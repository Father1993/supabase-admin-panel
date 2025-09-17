import { NextRequest, NextResponse } from 'next/server'

const PIM_URL = process.env.NEXT_PUBLIC_PIM_URL
const PIM_LOGIN = process.env.NEXT_PUBLIC_PIM_LOGIN
const PIM_PASS = process.env.NEXT_PUBLIC_PIM_PASS

// Кэшируем токен на уровне модуля
let authToken: string | null = null
let tokenExpiry: number = 0

async function getPimAuthToken(): Promise<string | null> {
  if (!PIM_URL || !PIM_LOGIN || !PIM_PASS) {
    console.error('[PIM API] Переменные окружения не настроены')
    return null
  }

  // Проверяем актуальность токена
  if (authToken && Date.now() < tokenExpiry) {
    return authToken
  }

  try {
    const response = await fetch(`${PIM_URL}/sign-in/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: PIM_LOGIN,
        password: PIM_PASS,
        remember: true
      })
    })

    if (!response.ok) {
      console.error('[PIM API] Ошибка авторизации:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.success && data.data?.access?.token) {
      authToken = data.data.access.token
      tokenExpiry = Date.now() + 50 * 60 * 1000 // 50 минут
      return authToken
    }
  } catch (error) {
    console.error('[PIM API] Ошибка получения токена:', error)
  }
  
  return null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'Product ID обязателен' }, { status: 400 })
  }

  const token = await getPimAuthToken()
  if (!token) {
    return NextResponse.json({ error: 'Не удалось получить токен' }, { status: 500 })
  }

  try {
    const response = await fetch(`${PIM_URL}/product/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 })
    }

    const data = await response.json()
    const picture = data.data?.picture
    const type = picture.type.toUpperCase()

    if (picture && picture.name) {
      const imageData = {
        url: `https://pim.uroven.pro/pictures/originals/${picture.name}.${type}`,
        width: picture.sizeX,
        height: picture.sizeY,
        type: type || 'noType'
      }
      
      return NextResponse.json(imageData)
    } else {
      return NextResponse.json({ error: 'Изображение не найдено' }, { status: 404 })
    }
  } catch (error) {
    console.error('[PIM API] Ошибка запроса:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

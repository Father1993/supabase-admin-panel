'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import Image from 'next/image'

export default function AdminImagesPage() {
  const [products, setProducts] = useState<Row[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)

  const [imageSize, setImageSize] = useState<{ w: number; h: number }>({
    w: 750,
    h: 1000,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    setCurrentUserEmail(user.email ?? null)
    setLoading(true)
    setError(null)

    try {
      // Получаем товары для проверки картинок
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('image_status', null)
        .not('image_optimized_url', 'is', null)
        .limit(50)

      if (error) {
        setError(error.message)
      } else {
        setProducts(data || [])
      }

      // Подсчитываем оставшиеся для проверки
      const { count: remainingCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .is('image_status', null)
        .not('image_optimized_url', 'is', null)
      setRemainingToConfirm(remainingCount ?? 0)
    } catch {
      setError('Ошибка загрузки данных')
    }

    setLoading(false)
  }

  async function updateImageStatus(
    product: Row,
    status: 'approved' | 'rejected' | 'replace_later'
  ) {
    if (!currentUserEmail) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }

    const { error } = await supabase
      .from('products')
      .update({
        image_status: status,
        image_confirmed: status === 'approved',
        image_confirmed_by_email: currentUserEmail,
        image_rejected: status === 'rejected',
      })
      .eq('id', product.id)

    if (error) {
      alert(`Ошибка обновления статуса: ${error.message}`)
      return
    }

    // Переходим к следующей картинке
    setRemainingToConfirm((prev) => Math.max(0, prev - 1))
    if (currentIndex < products.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Загружаем новую порцию
      await fetchProducts()
      setCurrentIndex(0)
    }
  }

  const currentProduct = products[currentIndex]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Проверка изображений'
        subtitle='Подтверждение качества изображений товаров'
      />

      <div className=' px-6 py-8 '>
        {/* Информация о работе */}
        <div className='bg-white border rounded-lg px-4 py-3'>
          <div className='text-sm text-gray-600'>
            Осталось изображений для проверки:{' '}
            <span className='font-medium text-gray-900'>
              {remainingToConfirm}
            </span>
          </div>
        </div>

        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <p className='text-slate-600 ml-3'>Загрузка...</p>
          </div>
        )}

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-red-800'>Ошибка: {error}</p>
          </div>
        )}

        {!loading && !error && currentProduct && (
          <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'>
            {/* Заголовок */}
            <div className='bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-slate-800'>
                    {currentProduct.product_name || 'Без названия'}
                  </h2>
                  <div className='flex gap-3 mt-2 text-sm text-slate-600'>
                    {currentProduct.article && (
                      <span>
                        Артикул:{' '}
                        <span className='font-medium'>
                          {currentProduct.article}
                        </span>
                      </span>
                    )}
                    {currentProduct.code_1c && (
                      <span>
                        Код 1С:{' '}
                        <span className='font-medium'>
                          {currentProduct.code_1c}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Изображение и кнопки */}
            <div className='p-8'>
              <div className='flex flex-col items-center  overflow-auto  w-full h-full'>
                {/* Изображение */}

                <div className='border-1 border-orange-300 p-0 bg-gray-100 rounded-0 relative'>
                  {currentProduct.image_optimized_url && (
                    <Image
                      width={imageSize.w}
                      height={imageSize.h}
                      src={currentProduct.image_optimized_url}
                      alt={currentProduct.product_name || 'Изображение товара'}
                      style={{
                        width: 'auto',
                        height: 'auto',
                        maxWidth: 'none',
                      }}
                      onLoad={(e) => {
                        const img = e.currentTarget
                        setImageSize({
                          w: img.naturalWidth,
                          h: img.naturalHeight,
                        })
                      }}
                    />
                  )}
                  {/* Сетка: отступы 100px и 150px со всех сторон */}
                  <div className='absolute inset-0 pointer-events-none opacity-40'>
                    {/* Вертикальные линии слева: 100px и 150px */}
                    <div
                      className='absolute top-0 bottom-0 left-[100px] w-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />
                    <div
                      className='absolute top-0 bottom-0 left-[150px] w-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />

                    {/* Вертикальные линии справа: 100px и 150px */}
                    <div
                      className='absolute top-0 bottom-0 right-[100px] w-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />
                    <div
                      className='absolute top-0 bottom-0 right-[150px] w-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to bottom, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />

                    {/* Горизонтальные линии сверху: 100px и 150px */}
                    <div
                      className='absolute left-0 right-0 top-[100px] h-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />
                    <div
                      className='absolute left-0 right-0 top-[150px] h-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />

                    {/* Горизонтальные линии снизу: 100px и 150px */}
                    <div
                      className='absolute left-0 right-0 bottom-[100px] h-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />
                    <div
                      className='absolute left-0 right-0 bottom-[150px] h-px'
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, #ffb86a 0, #ffb86a 10px, transparent 10px, transparent 15px)',
                      }}
                    />
                  </div>
                </div>

                {/* Статус */}
                <div className='text-center mt-4'>
                  <span className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                    ⏳ Ожидает проверки
                  </span>
                </div>
                {imageSize && (
                  <p className='text-sm text-gray-600 mt-4'>
                    Размер:{' '}
                    <span className='font-medium'>
                      {imageSize.w} × {imageSize.h}
                    </span>{' '}
                    px
                  </p>
                )}

                {/* Кнопки управления */}
                <div className='flex items-center gap-4 mt-4'>
                  <button
                    onClick={() =>
                      updateImageStatus(currentProduct, 'rejected')
                    }
                    className='flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium cursor-pointer'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <line x1='18' y1='6' x2='6' y2='18'></line>
                      <line x1='6' y1='6' x2='18' y2='18'></line>
                    </svg>
                    Отклонено
                  </button>

                  <button
                    onClick={() =>
                      updateImageStatus(currentProduct, 'replace_later')
                    }
                    className='flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium cursor-pointer'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <circle cx='12' cy='12' r='10'></circle>
                      <polyline points='12 6 12 12 16 14'></polyline>
                    </svg>
                    Требуется замена
                  </button>

                  <button
                    onClick={() =>
                      updateImageStatus(currentProduct, 'approved')
                    }
                    className='flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium cursor-pointer'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <polyline points='20 6 9 17 4 12'></polyline>
                    </svg>
                    Подтверждено
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className='text-center py-12'>
            <div className='bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🎉</span>
            </div>
            <h3 className='text-lg font-medium text-slate-800 mb-2'>
              Нет изображений для проверки
            </h3>
            <p className='text-slate-600'>
              Все изображения уже проверены или отклонены
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

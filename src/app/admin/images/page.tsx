'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { LoadingSpinner, ErrorMessage } from '@/components/UIStates'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

interface IUpdateData {
  image_status: 'approved' | 'rejected' | 'replace_later' | null
  image_confirmed: boolean
  image_rejected: boolean
  image_confirmed_by_email?: string | null
}

function AdminImagesContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId')
  const [products, setProducts] = useState<Row[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)
  const [isChangingDecision, setIsChangingDecision] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())
  const [timeUntilAfk, setTimeUntilAfk] = useState<number>(180) // 3 минуты в секундах

  const [imageSize, setImageSize] = useState<{ w: number; h: number }>({
    w: 750,
    h: 1000,
  })

  const lockImage = useCallback(
    async (productId: number) => {
      if (!currentUserEmail) return

      // Блокируем на 3 минуты
      const lockUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString()

      await supabase
        .from('products')
        .update({
          locked_until: lockUntil,
        })
        .eq('id', productId)
    },
    [currentUserEmail]
  )

  const unlockImage = useCallback(
    async (productId: number) => {
      if (!currentUserEmail) return

      await supabase
        .from('products')
        .update({
          locked_until: null,
        })
        .eq('id', productId)
    },
    [currentUserEmail]
  )

  const extendImageLock = useCallback(
    async (productId: number) => {
      if (!currentUserEmail) return

      // Продлеваем блокировку на 3 минуты
      const lockUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString()

      await supabase
        .from('products')
        .update({
          locked_until: lockUntil,
        })
        .eq('id', productId)
    },
    [currentUserEmail]
  )

  const fetchProducts = useCallback(async () => {
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
      let query = supabase.from('products').select('*')

      if (productId) {
        // Загружаем конкретный продукт
        query = query.eq('id', productId)
      } else {
        // Получаем товары для проверки картинок (исключаем заблокированные)
        const now = new Date().toISOString()
        query = query
          .is('image_status', null)
          .not('image_optimized_url', 'is', null)
          .or(`locked_until.is.null,locked_until.lt.${now}`)
          .limit(50)
      }

      const { data, error } = await query

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
  }, [productId])

  useEffect(() => {
    setIsChangingDecision(false)
    fetchProducts()
  }, [productId, fetchProducts])

  // Блокируем картинку при загрузке
  useEffect(() => {
    if (products.length > 0 && currentUserEmail) {
      const product = products[currentIndex]
      if (product) {
        const now = new Date()
        const lockUntil = product.locked_until
          ? new Date(product.locked_until)
          : null

        // Если картинка не заблокирована или блокировка истекла
        if (!lockUntil || lockUntil < now) {
          lockImage(Number(product.id))
        }
      }
    }
  }, [products, currentIndex, currentUserEmail, lockImage])

  // Блокируем картинку при переходе с списка (productId)
  useEffect(() => {
    if (productId && currentUserEmail && products.length > 0) {
      const product = products[0]
      if (product) {
        const now = new Date()
        const lockUntil = product.locked_until
          ? new Date(product.locked_until)
          : null

        // Если картинка не заблокирована или блокировка истекла
        if (!lockUntil || lockUntil < now) {
          lockImage(Number(product.id))
        }
      }
    }
  }, [productId, currentUserEmail, products, lockImage])

  // Разблокируем картинку при закрытии страницы
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (products.length > 0 && currentUserEmail) {
        const product = products[currentIndex]
        if (product) {
          unlockImage(Number(product.id))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (products.length > 0 && currentUserEmail) {
        const product = products[currentIndex]
        if (product) {
          unlockImage(Number(product.id))
        }
      }
    }
  }, [products, currentIndex, currentUserEmail, unlockImage])

  // AFK система - перенаправление через 3 минуты на странице
  useEffect(() => {
    const afkTimer = setInterval(() => {
      const now = Date.now()
      const timeOnPage = now - sessionStartTime
      const afkThreshold = 3 * 60 * 1000 // 3 минуты

      // Обновляем таймер обратного отсчета
      const remainingSeconds = Math.max(
        0,
        Math.floor((afkThreshold - timeOnPage) / 1000)
      )
      setTimeUntilAfk(remainingSeconds)

      if (timeOnPage > afkThreshold) {
        // Разблокируем текущую картинку перед перенаправлением
        if (products.length > 0 && currentUserEmail) {
          const product = products[currentIndex]
          if (product) {
            unlockImage(Number(product.id))
          }
        }

        // Перенаправляем на главную страницу
        window.location.href = '/'
      }
    }, 1000) // Проверяем каждую секунду

    return () => clearInterval(afkTimer)
  }, [sessionStartTime, products, currentIndex, currentUserEmail, unlockImage])

  async function updateImageStatus(
    product: Row,
    status: 'approved' | 'rejected' | 'replace_later' | null
  ) {
    if (!currentUserEmail && status !== null) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }

    const updateData: IUpdateData = {
      image_status: status,
      image_confirmed: status === 'approved',
      image_rejected: status === 'rejected',
    }

    // Если сбрасываем статус, очищаем email
    if (status === null) {
      updateData.image_confirmed_by_email = null
    } else {
      updateData.image_confirmed_by_email = currentUserEmail
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id)

    if (error) {
      alert(`Ошибка обновления статуса: ${error.message}`)
      return
    }

    // Разблокируем картинку
    await unlockImage(Number(product.id))

    // Сбрасываем таймер AFK при действии пользователя
    setSessionStartTime(Date.now())

    // Сбрасываем состояние изменения решения
    setIsChangingDecision(false)

    // Переходим к следующей картинке
    setRemainingToConfirm((prev) => Math.max(0, prev - 1))

    if (productId) {
      // Если был открыт конкретный продукт, возвращаемся к списку
      window.location.href = '/images'
    } else {
      if (currentIndex < products.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setIsChangingDecision(false)
      } else {
        // Загружаем новую порцию
        await fetchProducts()
        setCurrentIndex(0)
        setIsChangingDecision(false)
      }
    }
  }

  const currentProduct = products[currentIndex]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Проверка изображений'
        subtitle='Подтверждение качества изображений товаров'
      />

      {/* AFK индикатор в заголовке */}
      {timeUntilAfk <= 60 && timeUntilAfk > 0 && (
        <div className='max-w-7xl mx-auto px-4'>
          <div
            className={`text-center py-2 px-4 rounded-lg mb-4 ${
              timeUntilAfk < 30
                ? 'bg-red-50 border border-red-200'
                : timeUntilAfk < 60
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div className='flex items-center justify-center gap-3'>
              <p
                className={`text-sm font-medium ${
                  timeUntilAfk < 30
                    ? 'text-red-800'
                    : timeUntilAfk < 60
                      ? 'text-orange-800'
                      : 'text-yellow-800'
                }`}
              >
                ⚠️ Внимание! Вы будете автоматически перенаправлены через{' '}
                {Math.floor(timeUntilAfk / 60)}:
                {(timeUntilAfk % 60).toString().padStart(2, '0')} из-за
                бездействия.
              </p>
              <button
                onClick={async () => {
                  setSessionStartTime(Date.now())
                  if (currentProduct) {
                    await extendImageLock(Number(currentProduct.id))
                  }
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                  timeUntilAfk < 30
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : timeUntilAfk < 60
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                Продлить время
              </button>
            </div>
          </div>
        </div>
      )}

      <div className=' px-6 py-8 '>
        {/* Информация о работе */}
        <div className='bg-white border rounded-lg px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-600'>
              Осталось изображений для проверки:{' '}
              <span className='font-medium text-gray-900'>
                {remainingToConfirm}
              </span>
            </div>
            {productId && (
              <button
                onClick={() => (window.location.href = '/images')}
                className='text-blue-500 cursor-pointer hover:text-gray-500 transition-colors text-sm font-medium'
              >
                ← Вернуться к списку
              </button>
            )}
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}

        {!loading && !error && currentProduct && (
          <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'>
            {/* Проверка на заблокированную картинку */}
            {currentProduct.locked_until &&
              new Date(currentProduct.locked_until) > new Date() && (
                <div className='bg-red-50 border-b border-red-200 px-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <svg
                      className='w-5 h-5 text-red-500'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <div>
                      <p className='text-sm font-medium text-red-800'>
                        Эта картинка заблокирована для проверки
                      </p>
                      <p className='text-xs text-red-600 mt-1'>
                        Картинка проверяется другим пользователем. Блокировка
                        истекает:{' '}
                        {new Date(currentProduct.locked_until).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                      src={currentProduct.image_optimized_url}
                      alt={currentProduct.product_name || 'Изображение товара'}
                      width={imageSize.w || 750}
                      height={imageSize.h || 1000}
                      unoptimized={true}
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
                <div className='text-center mt-4 space-y-3'>
                  {currentProduct.image_status === 'approved' && (
                    <>
                      <span className='inline-flex items-center  px-2 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800'>
                        ✓ Подтверждено
                      </span>
                      {currentProduct.image_confirmed_by_email && (
                        <p className='text-sm text-gray-600'>
                          Проверено:{' '}
                          <span className='font-medium'>
                            {currentProduct.image_confirmed_by_email}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                  {currentProduct.image_status === 'rejected' && (
                    <>
                      <span className='inline-flex items-center  px-2 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800'>
                        ✗ Отклонено
                      </span>
                      {currentProduct.image_confirmed_by_email && (
                        <p className='text-sm text-gray-600'>
                          Проверено:{' '}
                          <span className='font-medium'>
                            {currentProduct.image_confirmed_by_email}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                  {currentProduct.image_status === 'replace_later' && (
                    <>
                      <span className='inline-flex items-center  px-2 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                        ⏱ Требуется замена
                      </span>
                      {currentProduct.image_confirmed_by_email && (
                        <p className='text-sm text-gray-600'>
                          Проверено:{' '}
                          <span className='font-medium'>
                            {currentProduct.image_confirmed_by_email}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                  {!currentProduct.image_status && (
                    <span className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
                      ⏳ Ожидает проверки
                    </span>
                  )}
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
                  {currentProduct.locked_until &&
                  new Date(currentProduct.locked_until) > new Date() ? (
                    // Если картинка заблокирована - показываем сообщение
                    <div className='text-center py-4'>
                      <p className='text-gray-500 text-sm'>
                        Картинка заблокирована для проверки другим пользователем
                      </p>
                    </div>
                  ) : currentProduct.image_status && !isChangingDecision ? (
                    // Если картинка уже проверена и не в режиме изменения - показываем кнопку изменения решения
                    <>
                      <button
                        onClick={() => setIsChangingDecision(true)}
                        className='flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium cursor-pointer'
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
                          <path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path>
                        </svg>
                        Изменить решение
                      </button>
                    </>
                  ) : (
                    // Если картинка не проверена - показываем кнопки для проверки
                    <>
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
                    </>
                  )}
                  {/* Кнопка отмены при изменении решения */}
                  {isChangingDecision && (
                    <button
                      onClick={() => setIsChangingDecision(false)}
                      className='flex items-center gap-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium cursor-pointer'
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
                      Отмена
                    </button>
                  )}
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

export default function AdminImagesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminImagesContent />
    </Suspense>
  )
}

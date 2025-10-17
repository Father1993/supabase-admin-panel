'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { ChangeEvent } from 'react'
import Image from 'next/image'
import { UserStatsPanel } from '@/components/UserStatsPanel'
import { UserFilter } from '@/components/UserFilter'
import { SortSelect } from '@/components/SortSelect'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/UIStates'
import { ADMIN_EMAILS } from '@/config/admin'

export default function ImagesPage() {
  const [products, setProducts] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'approved' | 'rejected' | 'replace_later' | 'pending'
  >('all')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasNoEmailItems, setHasNoEmailItems] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 })
  const pageSize = 52

  const fetchProducts = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }

    const userEmail = user.email ?? null
    setCurrentUser(userEmail)

    // Загрузка списка email'ов для админов
    if (userEmail && ADMIN_EMAILS.includes(userEmail) && !emails.length) {
      const { data: emailData } = await supabase
        .from('products')
        .select('image_confirmed_by_email')
        .in('image_status', ['approved', 'rejected', 'replace_later'])
        .not('image_confirmed_by_email', 'is', null)
      const uniqueEmails = [
        ...new Set(
          emailData?.map((d) => d.image_confirmed_by_email).filter(Boolean)
        ),
      ] as string[]
      setEmails(uniqueEmails.sort())

      // Проверка наличия элементов без почты
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .in('image_status', ['approved', 'rejected', 'replace_later'])
        .is('image_confirmed_by_email', null)
      setHasNoEmailItems((count ?? 0) > 0)
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .not('image_optimized_url', 'is', null)

      // Фильтр по пользователю
      if (selectedUser) {
        if (selectedUser === '__no_email__') {
          query = query.is('image_confirmed_by_email', null)
          // Показываем только подтвержденные (не pending)
          query = query.in('image_status', [
            'approved',
            'rejected',
            'replace_later',
          ])
        } else {
          query = query.eq('image_confirmed_by_email', selectedUser)
        }
        // Фильтрация по статусу
        if (filterStatus === 'approved') {
          query = query.eq('image_status', 'approved')
        } else if (filterStatus === 'rejected') {
          query = query.eq('image_status', 'rejected')
        } else if (filterStatus === 'replace_later') {
          query = query.eq('image_status', 'replace_later')
        }
      } else {
        // Без фильтра по пользователю - обычная фильтрация по статусу
        if (filterStatus === 'approved') {
          query = query.eq('image_status', 'approved')
        } else if (filterStatus === 'rejected') {
          query = query.eq('image_status', 'rejected')
        } else if (filterStatus === 'replace_later') {
          query = query.eq('image_status', 'replace_later')
        } else if (filterStatus === 'pending') {
          query = query.is('image_status', null)
        }
      }

      query = query
        .order('updated_at', { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1)

      const { data, error, count } = await query

      if (error) {
        setError(error.message)
      } else {
        setProducts(data || [])
        setTotal(count || 0)
      }

      // Подсчитываем товары для подтверждения
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
  }, [page, sortOrder, filterStatus, selectedUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Управление overflow body при открытии модального окна
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup при размонтировании компонента
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Все изображения'
        subtitle='Просмотр всех изображений товаров'
      />

      <div className='max-w-7xl mx-auto px-4 py-6 space-y-4'>
        {/* Фильтры и сортировка */}
        <div className='bg-white rounded-lg border p-4 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <UserFilter
              emails={emails}
              selected={selectedUser}
              onChange={(email) => {
                setSelectedUser(email)
                setPage(1)
              }}
              currentUser={currentUser}
              hasNoEmailItems={hasNoEmailItems}
            />
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Фильтр по статусу:
              </label>
              <select
                value={filterStatus}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setFilterStatus(e.target.value as typeof filterStatus)
                  setPage(1)
                }}
                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
              >
                <option value='all'>Все изображения</option>
                <option value='pending'>Не проверенные</option>
                <option value='approved'>Подтверждено</option>
                <option value='replace_later'>Требуется замена</option>
                <option value='rejected'>Отклонено</option>
              </select>
            </div>
            <SortSelect
              value={sortOrder}
              onChange={setSortOrder}
              label='Сортировка по дате:'
            />
          </div>
        </div>
        {/* Статистика */}
        <UserStatsPanel type='images' />
        {/* Пагинация сверху */}
        {!loading && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            remainingToConfirm={remainingToConfirm}
          />
        )}

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}

        {/* Список изображений */}
        {!loading && !error && products.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {products.map((product) => (
              <div
                key={product.id}
                className='bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow'
              >
                {/* Изображение */}
                <div className='aspect-square relative bg-gray-100'>
                  {product.image_optimized_url ? (
                    <>
                      <Image
                        fill
                        src={product.image_optimized_url}
                        alt={product.product_name || 'Изображение товара'}
                        className='w-full h-full object-contain'
                      />
                      {/* Кнопка лупы */}
                      <button
                        onClick={() =>
                          setSelectedImage(product.image_optimized_url || null)
                        }
                        className='absolute text-gray-600 top-2 left-1 bg-gray-300 bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 transition-all cursor-pointer'
                        title='Увеличить изображение'
                      >
                        <svg
                          width='12'
                          height='12'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                        >
                          <circle cx='11' cy='11' r='8' />
                          <path d='m21 21-4.35-4.35' />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='56'
                        height='56'
                        viewBox='0 0 30 30'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <rect
                          x='3'
                          y='3'
                          width='18'
                          height='18'
                          rx='2'
                          ry='2'
                        ></rect>
                        <circle cx='8.5' cy='8.5' r='1.5'></circle>
                        <polyline points='21 15 16 10 5 21'></polyline>
                      </svg>
                    </div>
                  )}

                  {/* Статус в углу */}
                  <div className='absolute top-2 right-2'>
                    {product.image_status === 'approved' && (
                      <span className='bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                        ✓
                      </span>
                    )}
                    {product.image_status === 'rejected' && (
                      <span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                        ✗
                      </span>
                    )}
                    {product.image_status === 'replace_later' && (
                      <span className='bg-yellow-500 text-white text-xs px-2 py-1 rounded-full'>
                        ⏱
                      </span>
                    )}
                    {!product.image_status && (
                      <span className='bg-gray-500 text-white text-xs px-2 py-1 rounded-full'>
                        ?
                      </span>
                    )}
                  </div>
                </div>

                {/* Информация о товаре */}
                <div className='p-3'>
                  <h3 className='font-medium text-gray-900 text-sm line-clamp-2 mb-1'>
                    {product.product_name || 'Без названия'}
                  </h3>
                  <div className='space-y-1 text-xs text-gray-600'>
                    {product.article && <p>Арт: {product.article}</p>}
                    {product.code_1c && <p>1С: {product.code_1c}</p>}
                  </div>

                  {/* Статус */}
                  <div className='mt-2'>
                    {product.image_status === 'approved' && (
                      <div className='text-xs text-green-700'>
                        <span className='font-medium'>Подтверждено</span>
                        {product.image_confirmed_by_email && (
                          <p className='text-gray-600 truncate'>
                            {product.image_confirmed_by_email}
                          </p>
                        )}
                      </div>
                    )}
                    {product.image_status === 'rejected' && (
                      <span className='text-xs font-medium text-red-700'>
                        Отклонено
                      </span>
                    )}
                    {product.image_status === 'replace_later' && (
                      <span className='text-xs font-medium text-yellow-700'>
                        Требуется замена
                      </span>
                    )}
                    {!product.image_status && (
                      <span className='text-xs font-medium text-gray-700'>
                        Ожидает проверки
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState message='Нет изображений для отображения.' />
        )}

        {/* Пагинация снизу */}
        {!loading && products.length > 0 && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            remainingToConfirm={remainingToConfirm}
          />
        )}
      </div>

      {/* Модальное окно для увеличенного изображения */}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 flex  items-center justify-center p-5 overflow-auto'
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => {
            setSelectedImage(null)
            setImageSize({ w: 0, h: 0 })
          }}
        >
          <div className='relative mt-25' onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImage}
              alt='Увеличенное изображение'
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
            <button
              className='absolute top-0 right-[-100px] cursor-pointer text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75'
              onClick={() => {
                setSelectedImage(null)
                setImageSize({ w: 0, h: 0 })
              }}
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { UserFilter } from '@/components/UserFilter'
import { SortSelect } from '@/components/SortSelect'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/UIStates'
import Image from 'next/image'
import { ADMIN_EMAILS } from '@/config/admin'

export default function ApprovedImagesPage() {
  const [products, setProducts] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [emails, setEmails] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasNoEmailItems, setHasNoEmailItems] = useState(false)
  const pageSize = 50

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
        .eq('image_status', 'approved')
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
        .eq('image_status', 'approved')
        .is('image_confirmed_by_email', null)
      setHasNoEmailItems((count ?? 0) > 0)
    }

    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('image_status', 'approved')

      if (selectedUser === '__no_email__') {
        query = query.is('image_confirmed_by_email', null)
      } else {
        const filterEmail = selectedUser || user.email
        query = query.eq('image_confirmed_by_email', filterEmail)
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
  }, [page, sortOrder, selectedUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Подтвержденные изображения'
        subtitle={`Изображения, подтвержденные вами (${currentUser || ''})`}
      />

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
        {/* Фильтры и сортировка */}
        <div className='bg-white rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
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
          <SortSelect value={sortOrder} onChange={setSortOrder} />
        </div>

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
        {!loading && !error && products.length === 0 && (
          <EmptyState message='У вас пока нет подтвержденных изображений.' />
        )}

        {/* Список товаров */}
        {!loading && !error && products.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {products.map((product) => (
              <div
                key={product.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow'
              >
                {/* Изображение */}
                <div className='aspect-square relative bg-gray-100'>
                  {product.image_optimized_url ? (
                    <Image
                      fill
                      src={product.image_optimized_url}
                      alt={product.product_name || 'Изображение товара'}
                      className='w-full h-full object-contain'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='48'
                        height='48'
                        viewBox='0 0 24 24'
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
                </div>

                {/* Информация о товаре */}
                <div className='p-4'>
                  <h3 className='font-semibold text-gray-900 mb-2 line-clamp-2'>
                    {product.product_name || 'Без названия'}
                  </h3>
                  <div className='space-y-1 text-sm text-gray-600'>
                    {product.article && (
                      <p>
                        Артикул:{' '}
                        <span className='font-medium'>{product.article}</span>
                      </p>
                    )}
                    {product.code_1c && (
                      <p>
                        Код 1С:{' '}
                        <span className='font-medium'>{product.code_1c}</span>
                      </p>
                    )}
                  </div>
                  <div className='mt-3'>
                    <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800'>
                      ✓ Подтверждено вами
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  )
}

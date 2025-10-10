'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { ProductImage } from '@/components/ProductImage'
import { ProductHeader } from '@/components/ProductHeader'
import { UserFilter } from '@/components/UserFilter'
import { ADMIN_EMAILS } from '@/config/admin'

export default function ApprovedProductsPage() {
  const [products, setProducts] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [emails, setEmails] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [hasNoEmailItems, setHasNoEmailItems] = useState(false)
  const pageSize = 50

  useEffect(() => {
    fetchProducts()
  }, [page, sortOrder, selectedUser]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProducts() {
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
        .select('confirmed_by_email')
        .eq('description_confirmed', true)
        .not('confirmed_by_email', 'is', null)
      const uniqueEmails = [...new Set(emailData?.map(d => d.confirmed_by_email).filter(Boolean))] as string[]
      setEmails(uniqueEmails.sort())
      
      // Проверка наличия элементов без почты
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('description_confirmed', true)
        .is('confirmed_by_email', null)
      setHasNoEmailItems((count ?? 0) > 0)
    }
    
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('description_confirmed', true)
        
      if (selectedUser === '__no_email__') {
        query = query.is('confirmed_by_email', null)
      } else {
        const filterEmail = selectedUser || user.email
        query = query.eq('confirmed_by_email', filterEmail)
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
    } catch {
      setError('Ошибка загрузки данных')
    }
    setLoading(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Подтвержденные товары'
        subtitle={`Товары, подтвержденные вами (${currentUser || ''})`}
      />

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
        {/* Фильтры и сортировка */}
        <div className='bg-white rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <UserFilter
            emails={emails}
            selected={selectedUser}
            onChange={(email) => { setSelectedUser(email); setPage(1) }}
            currentUser={currentUser}
            hasNoEmailItems={hasNoEmailItems}
          />
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Сортировка по дате обновления:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
            >
              <option value='desc'>Сначала свежие</option>
              <option value='asc'>Сначала старые</option>
            </select>
          </div>
        </div>

        {/* Пагинация сверху */}
        {!loading && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}

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

        {!loading && !error && products.length === 0 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 text-center'>
            <p className='text-blue-800'>
              У вас пока нет подтвержденных товаров.
            </p>
          </div>
        )}

        {/* Список товаров */}
        {!loading && !error && products.length > 0 && (
          <div className='space-y-6'>
            {products.map((product) => (
              <div
                key={product.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'
              >
                {/* Заголовок */}
                <ProductHeader
                  product={product}
                  additionalBadges={[
                    <span
                      key='confirmed'
                      className='bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium'
                    >
                      ✓ Подтверждено вами
                    </span>,
                  ]}
                />

                {/* Изображение и описания */}
                <div className='p-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Левая колонка: изображение + краткое описание */}
                    <div className='space-y-6'>
                      {/* Изображение товара */}
                      <ProductImage
                        imageUrl={product.image_optimized_url}
                        productName={product.product_name}
                      />

                      {/* Краткое описание */}
                      {product.short_description && (
                        <div className='space-y-3'>
                          <h4 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
                            <div className='w-1 h-5 bg-amber-400 rounded-full'></div>
                            Краткое описание
                          </h4>
                          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
                            <SafeHtml
                              html={product.short_description}
                              className='rich-html rich-html-compact'
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Правая колонка: полное описание */}
                    {product.description && (
                      <div className='space-y-3'>
                        <h4 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
                          <div className='w-1 h-5 bg-emerald-400 rounded-full'></div>
                          Полное описание
                        </h4>
                        <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-4'>
                          <SafeHtml
                            html={product.description}
                            className='rich-html rich-html-detailed'
                          />
                        </div>
                      </div>
                    )}
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
          />
        )}
      </div>
    </div>
  )
}

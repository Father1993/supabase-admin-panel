'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { ProductImage } from '@/components/ProductImage'
import { ProductHeader } from '@/components/ProductHeader'
import { ProductSearch } from '@/components/ProductSearch'
import { UserStatsPanel } from '@/components/UserStatsPanel'

export default function ProductsPage() {
  const [products, setProducts] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedProduct, setSelectedProduct] = useState<Row | null>(null)

  const handleSelectProduct = (product: Row | null) => {
    setSelectedProduct(product)
    setPage(1) // Сбрасываем страницу
  }
  const pageSize = 50

  useEffect(() => {
    fetchProducts()
  }, [page, sortOrder, selectedProduct]) // eslint-disable-line react-hooks/exhaustive-deps

  async function searchProducts(query: string): Promise<Row[]> {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('description_added', true)
      .or(
        `product_name.ilike.%${query}%,id.eq.${isNaN(Number(query)) ? 0 : Number(query)},code_1c.ilike.%${query}%,article.ilike.%${query}%`
      )
      .limit(10)
    return data || []
  }

  async function fetchProducts() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('description_added', true)

      if (selectedProduct) {
        query = query.eq('id', selectedProduct.id)
      } else {
        query = query
          .order('updated_at', { ascending: sortOrder === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1)
      }

      const { data, error, count } = await query

      if (error) {
        setError(error.message)
      } else {
        setProducts(data || [])
        setTotal(count || 0)
      }

      // Подсчитываем товары для подтверждения
      if (!selectedProduct) {
        const { count: remainingCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('description_added', true)
          .eq('description_confirmed', false)
        setRemainingToConfirm(remainingCount ?? 0)
      }
    } catch {
      setError('Ошибка загрузки данных')
    }

    setLoading(false)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Список товаров'
        subtitle='Просмотр товаров с готовыми описаниями'
      />

      <div className='max-w-7xl mx-auto px-4 py-6 space-y-4'>
        {/* Сортировка */}
        {!selectedProduct && (
          <div className='bg-white rounded-lg border p-2'>
            <label className='block text-sm font-medium text-gray-700'>
              Сортировка по дате обновления:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className='px-1 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
            >
              <option value='desc'>Сначала свежие</option>
              <option value='asc'>Сначала старые</option>
            </select>
          </div>
        )}
        {/* Поиск */}
        <div className='bg-white rounded-lg border p-4'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Поиск товаров:
          </label>
          <ProductSearch
            onSelectProduct={handleSelectProduct}
            selectedProduct={selectedProduct}
            searchProducts={searchProducts}
          />
        </div>

        {/* Статистика */}
        <UserStatsPanel type="products" />

        {/* Пагинация сверху */}
        {!loading && !selectedProduct && (
          <PaginationBar
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            remainingToConfirm={remainingToConfirm}
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

        {/* Список товаров */}
        {!loading && !error && (
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
                    ...(product.description_confirmed
                      ? [
                          <span
                            key='confirmed'
                            className='bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium'
                          >
                            ✓ Подтверждено
                          </span>,
                        ]
                      : []),
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
        {!loading && !selectedProduct && (
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

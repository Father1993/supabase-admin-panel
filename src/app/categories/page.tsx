'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Category } from '@/types/categories'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { CategoryHeader } from '@/components/CategoryHeader'
import { CategorySearch } from '@/components/CategorySearch'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )

  const handleSelectCategory = (category: Category | null) => {
    setSelectedCategory(category)
    setPage(1)
  }
  const pageSize = 50

  useEffect(() => {
    fetchCategories()
  }, [page, sortOrder, selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  async function searchCategories(query: string): Promise<Category[]> {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('description_added', true)
      .or(
        `header.ilike.%${query}%,id.eq.${isNaN(Number(query)) ? 0 : Number(query)}`
      )
      .limit(10)
    return data || []
  }

  async function fetchCategories() {
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
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('description_added', true)

      if (selectedCategory) {
        query = query.eq('id', selectedCategory.id)
      } else {
        query = query
          .order('updated_at', { ascending: sortOrder === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1)
      }

      const { data, error, count } = await query

      if (error) {
        setError(error.message)
      } else {
        setCategories(data || [])
        setTotal(count || 0)
      }

      // Подсчитываем категории для подтверждения
      if (!selectedCategory) {
        const { count: remainingCount } = await supabase
          .from('categories')
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
        title='Список категорий'
        subtitle='Просмотр категорий с готовыми описаниями'
      />

      <div className='max-w-7xl mx-auto px-4 py-6 space-y-4'>
        {/* Сортировка */}
        {!selectedCategory && (
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
            Поиск категорий:
          </label>
          <CategorySearch
            onSelectCategory={handleSelectCategory}
            selectedCategory={selectedCategory}
            searchCategories={searchCategories}
          />
        </div>

        {/* Пагинация сверху */}
        {!loading && !selectedCategory && (
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

        {/* Список категорий */}
        {!loading && !error && (
          <div className='space-y-6'>
            {categories.map((category) => (
              <div
                key={category.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'
              >
                {/* Заголовок */}
                <CategoryHeader
                  category={category}
                  additionalBadges={[
                    ...(category.description_confirmed
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

                {/* Описание */}
                <div className='p-6'>
                  {category.description ? (
                    <div className='space-y-3'>
                      <h4 className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
                        <div className='w-1 h-5 bg-emerald-400 rounded-full'></div>
                        Описание категории
                      </h4>
                      <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-4'>
                        <SafeHtml
                          html={category.description}
                          className='rich-html rich-html-detailed'
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      <p>Описание отсутствует</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагинация снизу */}
        {!loading && !selectedCategory && (
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

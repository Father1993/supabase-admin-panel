'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Category } from '@/types/categories'
import { Header } from '@/components/Header'
import { PaginationBar } from '@/components/PaginationBar'
import { CategoryHeader } from '@/components/CategoryHeader'
import { UserFilter } from '@/components/UserFilter'
import { UserStatsPanel } from '@/components/UserStatsPanel'
import { SortSelect } from '@/components/SortSelect'
import { LoadingSpinner, ErrorMessage, EmptyState } from '@/components/UIStates'
import { ADMIN_EMAILS } from '@/config/admin'

export default function ApprovedCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
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
    fetchCategories()
  }, [page, sortOrder, selectedUser]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCategories() {
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
        .from('categories')
        .select('confirmed_by_email')
        .eq('description_confirmed', true)
        .not('confirmed_by_email', 'is', null)
      const uniqueEmails = [
        ...new Set(emailData?.map((d) => d.confirmed_by_email).filter(Boolean)),
      ] as string[]
      setEmails(uniqueEmails.sort())

      // Проверка наличия элементов без почты
      const { count } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('description_confirmed', true)
        .is('confirmed_by_email', null)
      setHasNoEmailItems((count ?? 0) > 0)
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('categories')
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
        setCategories(data || [])
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
        title='Подтвержденные категории'
        subtitle={`Категории, подтвержденные вами (${currentUser || ''})`}
      />

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
        <UserStatsPanel type='categories' />

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
          />
        )}

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}
        {!loading && !error && categories.length === 0 && (
          <EmptyState message='У вас пока нет подтвержденных категорий.' />
        )}

        {/* Список категорий */}
        {!loading && !error && categories.length > 0 && (
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
                    <span
                      key='confirmed'
                      className='bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium'
                    >
                      ✓ Подтверждено вами
                    </span>,
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
        {!loading && categories.length > 0 && (
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

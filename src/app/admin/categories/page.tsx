'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Category } from '@/types/categories'
import { Header } from '@/components/Header'
import { RichTextEditorModal } from '@/components/RichTextEditorModal'
import { CategoryHeader } from '@/components/CategoryHeader'

export default function AdminCategoriesPage() {
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)

  const [editorState, setEditorState] = useState<{
    open: boolean
    categoryId: number | null
    field: 'description' | null
    initialHtml: string
  }>({ open: false, categoryId: null, field: null, initialHtml: '' })

  useEffect(() => {
    fetchRandomCategory()
  }, [])

  async function fetchRandomCategory() {
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
      // Ищем свободную рандомную категорию
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('description_added', true)
        .eq('description_confirmed', false)
        .eq('is_rejected', false)
        .limit(50) // Берём 50 записей для рандомизации

      if (error) {
        setError(error.message)
        setCurrentCategory(null)
      } else if (data && data.length > 0) {
        // Выбираем случайную категорию из полученных
        const randomIndex = Math.floor(Math.random() * data.length)
        const category = data[randomIndex]

        setCurrentCategory(category)
      } else {
        setCurrentCategory(null)
        setError('Нет доступных категорий для подтверждения')
      }

      // Подсчитываем оставшиеся категории
      const { count: remainingCount } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('description_added', true)
        .eq('description_confirmed', false)
        .eq('is_rejected', false)
      setRemainingToConfirm(remainingCount ?? 0)
    } catch {
      setError('Ошибка загрузки данных')
      setCurrentCategory(null)
    }

    setLoading(false)
  }

  function openEditor(category: Category, field: 'description') {
    setEditorState({
      open: true,
      categoryId: category.id,
      field,
      initialHtml: String(category[field] ?? ''),
    })
  }

  async function saveEditor(html: string) {
    if (
      !editorState.open ||
      !editorState.field ||
      editorState.categoryId == null
    )
      return
    const sanitized = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    })
    const fieldName = editorState.field
    const { data, error } = await supabase
      .from('categories')
      .update({ [fieldName]: sanitized })
      .eq('id', editorState.categoryId)
      .select('id, description')
    if (error) {
      alert(`Ошибка сохранения: ${error.message}`)
      return
    }
    const updated = data?.[0]
    if (updated && currentCategory) {
      setCurrentCategory({ ...currentCategory, ...updated })
    }
    setEditorState({
      open: false,
      categoryId: null,
      field: null,
      initialHtml: '',
    })
  }

  async function confirmDescription(category: Category) {
    if (!currentUserEmail) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }
    const { error } = await supabase
      .from('categories')
      .update({
        description_confirmed: true,
        confirmed_by_email: currentUserEmail,
      })
      .eq('id', category.id)
      .select('id, description_confirmed, confirmed_by_email')
    if (error) {
      alert(`Ошибка подтверждения: ${error.message}`)
      return
    }

    // Успешно подтвердили - загружаем следующую категорию
    setRemainingToConfirm((x) => Math.max(0, x - 1))
    window.location.reload()
  }

  async function rejectCategory(category: Category) {
    if (!currentUserEmail) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }
    const { error } = await supabase
      .from('categories')
      .update({
        is_rejected: true,
        confirmed_by_email: currentUserEmail,
      })
      .eq('id', category.id)
    if (error) {
      alert(`Ошибка отклонения: ${error.message}`)
      return
    }

    // Успешно отклонили - загружаем следующую категорию
    setRemainingToConfirm((x) => Math.max(0, x - 1))
    window.location.reload()
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Header
        title='Проверка категорий'
        subtitle='Просмотр и одобрение AI-генерированных описаний категорий'
      />

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
        {/* Информация о работе */}
        <div className='bg-white border rounded-lg px-4 py-3'>
          <div className='text-sm text-gray-600'>
            Осталось категорий для подтверждения:{' '}
            <span className='font-medium text-gray-900'>
              {remainingToConfirm}
            </span>
          </div>
        </div>

        {loading && (
          <div className='flex items-center justify-center py-12'>
            <div className='flex items-center space-x-3'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <p className='text-slate-600 text-lg'>Загрузка...</p>
            </div>
          </div>
        )}

        {error && (
          <div
            className='bg-red-50 border border-red-200 rounded-lg p-4'
            role='alert'
          >
            <p className='text-red-800 font-medium'>Ошибка: {error}</p>
          </div>
        )}

        {!loading && !error && currentCategory && (
          <div className='space-y-8'>
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300'>
              {/* Заголовок карточки */}
              <CategoryHeader category={currentCategory} size='large' />

              {/* Контент карточки */}
              <div className='p-8'>
                {/* Описание категории */}
                {currentCategory.description ? (
                  <div className='space-y-4'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full'></div>
                      <h3 className='text-lg font-semibold text-slate-800'>
                        Описание категории
                      </h3>
                      <span className='bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium'>
                        AI Generated
                      </span>
                    </div>
                    <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-6'>
                      <SafeHtml
                        html={currentCategory.description}
                        className='rich-html rich-html-detailed'
                      />
                    </div>
                    <div className='flex gap-3'>
                      <button
                        onClick={() =>
                          openEditor(currentCategory, 'description')
                        }
                        className='px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200'
                      >
                        Редактировать описание
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-12 text-gray-500'>
                    <p className='text-lg'>Описание отсутствует</p>
                  </div>
                )}

                <div className='mt-6 flex items-center justify-between gap-3'>
                  <button
                    onClick={() => rejectCategory(currentCategory)}
                    className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
                  >
                    Отклонить описание
                  </button>
                  <button
                    onClick={() => confirmDescription(currentCategory)}
                    className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors'
                  >
                    Подтвердить описание
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !currentCategory && (
          <div className='text-center py-12'>
            <div className='bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🎉</span>
            </div>
            <h3 className='text-lg font-medium text-slate-800 mb-2'>
              Нет категорий для подтверждения
            </h3>
            <p className='text-slate-600'>Все категории уже обработаны</p>
          </div>
        )}
      </div>

      <RichTextEditorModal
        open={editorState.open}
        initialHtml={editorState.initialHtml}
        onCancel={() =>
          setEditorState({
            open: false,
            categoryId: null,
            field: null,
            initialHtml: '',
          })
        }
        onSave={saveEditor}
      />
    </div>
  )
}

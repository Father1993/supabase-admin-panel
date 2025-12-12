'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { supabase } from '@/lib/supabaseClient'
import { SafeHtml } from '@/components/SafeHtml'
import { Row } from '@/types/products'
import { Header } from '@/components/Header'
import { ProductImage } from '@/components/ProductImage'
import { RichTextEditorModal } from '@/components/RichTextEditorModal'
import { RejectButton } from '@/components/RejectButton'
import { ProductHeader } from '@/components/ProductHeader'
import { LoadingSpinner, ErrorMessage } from '@/components/UIStates'

export default function AdminPage() {
  const [currentRow, setCurrentRow] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [remainingToConfirm, setRemainingToConfirm] = useState(0)

  const [editorState, setEditorState] = useState<{
    open: boolean
    rowId: string | number | null
    field: 'short_description' | 'description' | null
    initialHtml: string
  }>({ open: false, rowId: null, field: null, initialHtml: '' })

  useEffect(() => {
    const fetchRandomRow = async () => {
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
        // Освобождаем просроченные блокировки (больше 10 минут)
        const tenMinutesAgo = new Date(
          Date.now() - 10 * 60 * 1000
        ).toISOString()
        await supabase
          .from('products')
          .update({ locked_until: null })
          .lt('locked_until', tenMinutesAgo)

        // Ищем свободную рандомную карточку
        const { data, error } = await supabase
          .from('products')
          .select(
            'id, uid, product_name, article, code_1c, short_description, description, description_added, push_to_pim, description_confirmed, confirmed_by_email, created_at, updated_at, locked_until, link_pim, image_optimized_url, image_url'
          )
          .eq('description_added', true)
          .eq('description_confirmed', false)
          .eq('is_rejected', false)
          .or(
            'locked_until.is.null,locked_until.lt.' + new Date().toISOString()
          )
          .limit(50) // Берём 50 записей для рандомизации

        if (error) {
          setError(error.message)
          setCurrentRow(null)
        } else if (data && data.length > 0) {
          // Выбираем случайную карточку из полученных
          const randomIndex = Math.floor(Math.random() * data.length)
          const row = data[randomIndex]

          // Блокируем карточку на 10 минут
          const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString()
          await supabase
            .from('products')
            .update({ locked_until: lockUntil })
            .eq('id', row.id)

          setCurrentRow({ ...row, locked_until: lockUntil })
        } else {
          setCurrentRow(null)
          setError('Нет доступных товаров для подтверждения')
        }

        // Подсчитываем оставшиеся товары
        const { count: remainingCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('description_added', true)
          .eq('description_confirmed', false)
          .eq('is_rejected', false)
        setRemainingToConfirm(remainingCount ?? 0)
      } catch {
        setError('Ошибка загрузки данных')
        setCurrentRow(null)
      }

      setLoading(false)
    }

    fetchRandomRow()
  }, [])

  function openEditor(row: Row, field: 'short_description' | 'description') {
    setEditorState({
      open: true,
      rowId: row.id,
      field,
      initialHtml: String(row[field] ?? ''),
    })
  }

  async function saveEditor(html: string) {
    if (!editorState.open || !editorState.field || editorState.rowId == null)
      return
    const sanitized = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    })
    const fieldName = editorState.field
    const { data, error } = await supabase
      .from('products')
      .update({ [fieldName]: sanitized })
      .eq('id', editorState.rowId)
      .select('id, short_description, description')
    if (error) {
      alert(`Ошибка сохранения: ${error.message}`)
      return
    }
    const updated = data?.[0]
    if (updated && currentRow) {
      setCurrentRow({ ...currentRow, ...updated })
    }
    setEditorState({
      open: false,
      rowId: null,
      field: null,
      initialHtml: '',
    })
  }

  async function confirmDescription(row: Row) {
    if (!currentUserEmail) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }
    const { error } = await supabase
      .from('products')
      .update({
        description_confirmed: true,
        confirmed_by_email: currentUserEmail,
        locked_until: null, // Освобождаем блокировку
      })
      .eq('id', row.id)
      .select('id, description_confirmed, confirmed_by_email')
    if (error) {
      alert(`Ошибка подтверждения: ${error.message}`)
      return
    }

    // Успешно подтвердили - загружаем следующую карточку
    setRemainingToConfirm((x) => Math.max(0, x - 1))
    window.location.reload() // Простая перезагрузка для получения новой карточки
  }

  async function rejectProduct(row: Row) {
    if (!currentUserEmail) {
      alert('Нет email пользователя. Авторизуйтесь заново.')
      return
    }
    const { error } = await supabase
      .from('products')
      .update({
        is_rejected: true,
        confirmed_by_email: currentUserEmail,
        locked_until: null, // Освобождаем блокировку
      })
      .eq('id', row.id)
    if (error) {
      alert(`Ошибка отклонения: ${error.message}`)
      return
    }

    // Успешно отклонили - загружаем следующую карточку
    setRemainingToConfirm((x) => Math.max(0, x - 1))
    window.location.reload()
  }

  // Кнопка ручной загрузки следующей карточки удалена как избыточная

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      {/* Шапка */}
      <Header />

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
        {/* Информация о работе */}
        <div className='bg-white border rounded-lg px-4 py-3'>
          <div className='text-sm text-gray-600'>
            Осталось товаров для подтверждения:{' '}
            <span className='font-medium text-gray-900'>
              {remainingToConfirm}
            </span>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}

        {!loading && !error && currentRow && (
          <div className='space-y-8'>
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300'>
              {/* Заголовок карточки */}
              <ProductHeader
                product={currentRow}
                size='large'
                additionalBadges={[
                  <span
                    key='locked'
                    className='bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium text-xs'
                  >
                    🔒 Заблокировано для вас
                  </span>,
                ]}
              />

              {/* Контент карточки */}
              <div className='p-8'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  {/* Левая колонка: изображение + краткое описание */}
                  <div className='space-y-6'>
                    {/* Изображение товара */}
                    <ProductImage
                      imageUrl={currentRow.image_url}
                      productName={currentRow.product_name}
                    />

                    {/* Краткое описание */}
                    {currentRow.short_description && (
                      <div className='space-y-4'>
                        <div className='flex items-center space-x-2'>
                          <div className='w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full'></div>
                          <h3 className='text-lg font-semibold text-slate-800'>
                            Краткое описание
                          </h3>
                          <span className='bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium'>
                            AI Generated
                          </span>
                        </div>
                        <div className='bg-amber-50 border border-amber-200 rounded-lg p-6'>
                          <SafeHtml
                            html={currentRow.short_description}
                            className='rich-html rich-html-compact'
                          />
                        </div>
                        <div className='flex gap-3'>
                          <button
                            onClick={() =>
                              openEditor(currentRow, 'short_description')
                            }
                            className='px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200'
                          >
                            Редактировать краткое описание
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Правая колонка: полное описание */}
                  {currentRow.description && (
                    <div className='space-y-4'>
                      <div className='flex items-center space-x-2'>
                        <div className='w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full'></div>
                        <h3 className='text-lg font-semibold text-slate-800'>
                          Полное описание
                        </h3>
                        <span className='bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium'>
                          AI Generated
                        </span>
                      </div>
                      <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-6'>
                        <SafeHtml
                          html={currentRow.description}
                          className='rich-html rich-html-detailed'
                        />
                      </div>
                      <div className='flex gap-3'>
                        <button
                          onClick={() => openEditor(currentRow, 'description')}
                          className='px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200'
                        >
                          Редактировать полное описание
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Если есть только одно описание, покажем его во всю ширину */}
                {currentRow.short_description && !currentRow.description && (
                  <div className='mt-6'>
                    <div className='flex items-center space-x-2 mb-4'>
                      <div className='w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full'></div>
                      <h3 className='text-lg font-semibold text-slate-800'>
                        Описание товара
                      </h3>
                      <span className='bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium'>
                        AI Generated
                      </span>
                    </div>
                    <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-6'>
                      <SafeHtml
                        html={currentRow.short_description}
                        className='rich-html rich-html-detailed'
                      />
                    </div>
                    <div className='flex gap-3 mt-3'>
                      <button
                        onClick={() =>
                          openEditor(currentRow, 'short_description')
                        }
                        className='px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200'
                      >
                        Редактировать описание
                      </button>
                    </div>
                  </div>
                )}

                {!currentRow.short_description && currentRow.description && (
                  <div className='mt-6'>
                    <div className='flex items-center space-x-2 mb-4'>
                      <div className='w-1 h-6 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full'></div>
                      <h3 className='text-lg font-semibold text-slate-800'>
                        Описание товара
                      </h3>
                      <span className='bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium'>
                        AI Generated
                      </span>
                    </div>
                    <div className='bg-emerald-50 border border-emerald-200 rounded-lg p-6'>
                      <SafeHtml
                        html={currentRow.description}
                        className='rich-html rich-html-detailed'
                      />
                    </div>
                    <div className='flex gap-3 mt-3'>
                      <button
                        onClick={() => openEditor(currentRow, 'description')}
                        className='px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200'
                      >
                        Редактировать описание
                      </button>
                    </div>
                  </div>
                )}
                <div className='mt-6 flex items-center justify-between gap-3'>
                  <RejectButton row={currentRow} onReject={rejectProduct} />
                  <button
                    onClick={() => confirmDescription(currentRow)}
                    className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors'
                  >
                    Подтвердить описание
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !currentRow && (
          <div className='text-center py-12'>
            <div className='bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>🎉</span>
            </div>
            <h3 className='text-lg font-medium text-slate-800 mb-2'>
              Нет товаров для подтверждения
            </h3>
            <p className='text-slate-600'>
              Все товары уже обработаны или заблокированы другими пользователями
            </p>
          </div>
        )}
      </div>

      <RichTextEditorModal
        open={editorState.open}
        initialHtml={editorState.initialHtml}
        onCancel={() =>
          setEditorState({
            open: false,
            rowId: null,
            field: null,
            initialHtml: '',
          })
        }
        onSave={saveEditor}
      />
    </div>
  )
}

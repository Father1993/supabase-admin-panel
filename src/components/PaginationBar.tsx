'use client'

import { PaginationProps } from '@/types/main'

export function PaginationBar({
  page,
  total,
  pageSize,
  onPageChange,
  remainingToConfirm = 0,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className='bg-white rounded-xl shadow-lg border border-slate-200 px-6 py-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='text-sm text-slate-600 font-medium'>
          Показано{' '}
          <span className='text-slate-900 font-semibold'>
            {from}–{to}
          </span>{' '}
          из <span className='text-slate-900 font-semibold'>{total}</span>{' '}
          товаров
          <span className='ml-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200'>
            Осталось подтвердить:{' '}
            <strong className='font-semibold text-emerald-900'>
              {remainingToConfirm}
            </strong>
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <button
            className='px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            « Первая
          </button>
          <button
            className='px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ‹ Назад
          </button>
          <span className='px-4 py-2 text-sm font-semibold text-slate-800 bg-blue-50 border border-blue-200 rounded-lg'>
            Стр. {page} / {totalPages}
          </span>
          <button
            className='px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Вперёд ›
          </button>
          <button
            className='px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            Последняя »
          </button>
        </div>
      </div>
    </div>
  )
}

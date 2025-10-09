'use client'

import { Category } from '@/types/categories'

type Props = {
  category: Category
  size?: 'default' | 'large'
  additionalBadges?: React.ReactNode[]
}

export function CategoryHeader({
  category,
  size = 'default',
  additionalBadges = [],
}: Props) {
  const sizeClasses = size === 'large' ? 'px-6 py-5' : 'px-5 py-4'

  return (
    <div
      className={`bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 ${sizeClasses}`}
    >
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='space-y-1'>
          <h2 className='text-xl font-bold text-slate-800'>
            {category.header || 'Без названия'}
          </h2>
          <div className='flex flex-wrap items-center gap-2 text-sm text-slate-600'>
            <span>ID: {category.id}</span>
            {category.level !== null && category.level !== undefined && (
              <>
                <span className='text-slate-400'>•</span>
                <span>Уровень: {category.level}</span>
              </>
            )}
            {category.product_count !== null &&
              category.product_count !== undefined && (
                <>
                  <span className='text-slate-400'>•</span>
                  <span>Товаров: {category.product_count}</span>
                </>
              )}
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          {additionalBadges.map((badge, idx) => (
            <span key={idx}>{badge}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

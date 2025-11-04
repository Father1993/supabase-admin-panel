'use client'

import { ProductHeaderProps } from '@/types/main'

export function ProductHeader({
  product,
  size = 'medium',
  additionalBadges = [],
}: ProductHeaderProps) {
  const isLarge = size === 'large'
  const headerClass = isLarge ? 'text-2xl font-bold' : 'text-xl font-bold'
  const containerClass = isLarge ? 'px-8 py-6' : 'px-6 py-4'

  return (
    <div
      className={`bg-gradient-to-r from-slate-50 to-blue-50 ${containerClass} border-b border-slate-200`}
    >
      <div className='flex justify-between items-start'>
        <div className={isLarge ? 'flex-1' : ''}>
          {product.product_name && (
            <h2
              className={`${headerClass} text-slate-900 mb-2 ${isLarge ? 'leading-tight' : ''}`}
            >
              {product.product_name}
            </h2>
          )}
          <div className='flex flex-wrap gap-4 text-sm'>
            <span className='bg-slate-100 px-3 py-1 rounded-full'>
              <span className='text-slate-500 font-medium'>ID:</span>
              <span className='text-slate-800 ml-1'>{String(product.id)}</span>
            </span>
            {product.uid && (
              <span className='bg-blue-100 px-3 py-1 rounded-full'>
                <span className='text-blue-600 font-medium'>UID:</span>
                <span className='text-blue-800 ml-1'>{product.uid}</span>
              </span>
            )}
            {product.article && (
              <span className='bg-violet-100 px-3 py-1 rounded-full'>
                <span className='text-violet-600 font-medium'>Артикул:</span>
                <span className='text-violet-800 ml-1'>{product.article}</span>
              </span>
            )}
            {product.code_1c && (
              <span className='bg-teal-100 px-3 py-1 rounded-full'>
                <span className='text-teal-600 font-medium'>Код 1С:</span>
                <span className='text-teal-800 ml-1'>{product.code_1c}</span>
              </span>
            )}
            {typeof product.push_to_pim === 'boolean' && (
              <span
                className={`px-3 py-1 rounded-full font-medium ${
                  product.push_to_pim
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                PIM: {product.push_to_pim ? '✓ Загружен' : 'Не загружен'}
              </span>
            )}
            {product.link_pim && (
              <a
                href={product.link_pim}
                target='_blank'
                rel='noopener noreferrer'
                className='px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium hover:bg-blue-200'
              >
                Открыть в PIM ↗
              </a>
            )}
            {additionalBadges.map((badge, index) => (
              <span key={index}>{badge}</span>
            ))}
          </div>
        </div>
        {product.updated_at && (
          <div className='text-sm text-slate-500'>
            {new Date(product.updated_at).toLocaleDateString('ru')}
          </div>
        )}
      </div>
    </div>
  )
}

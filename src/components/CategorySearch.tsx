'use client'

import { useState, useEffect, useRef } from 'react'
import { Category } from '@/types/categories'

type Props = {
  onSelectCategory: (category: Category | null) => void
  selectedCategory: Category | null
  searchCategories: (query: string) => Promise<Category[]>
}

export function CategorySearch({
  onSelectCategory,
  selectedCategory,
  searchCategories,
}: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Category[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true)
        try {
          const results = await searchCategories(query)
          setSuggestions(results)
          setShowSuggestions(true)
        } catch (error) {
          console.error('Ошибка поиска:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, searchCategories])

  const handleSelectCategory = (category: Category) => {
    onSelectCategory(category)
    setQuery('')
    setShowSuggestions(false)
  }

  const handleClearSelection = () => {
    onSelectCategory(null)
    setQuery('')
  }

  return (
    <div className='relative' ref={wrapperRef}>
      {selectedCategory ? (
        <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <span className='text-sm text-blue-800'>
            Выбрана категория:{' '}
            <strong>{selectedCategory.header || 'Без названия'}</strong> (ID:{' '}
            {selectedCategory.id})
          </span>
          <button
            onClick={handleClearSelection}
            className='ml-auto text-blue-600 hover:text-blue-800 text-sm underline'
          >
            Сбросить
          </button>
        </div>
      ) : (
        <>
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Введите название категории или ID...'
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          />

          {loading && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto'>
              {suggestions.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className='w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
                >
                  <div className='font-medium text-gray-900'>
                    {category.header || 'Без названия'}
                  </div>
                  <div className='text-sm text-gray-500'>
                    ID: {category.id}
                    {category.level !== null && ` • Уровень: ${category.level}`}
                    {category.product_count !== null &&
                      ` • Товаров: ${category.product_count}`}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions &&
            suggestions.length === 0 &&
            query.length >= 2 &&
            !loading && (
              <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4'>
                <p className='text-gray-500 text-sm'>Категории не найдены</p>
              </div>
            )}
        </>
      )}
    </div>
  )
}

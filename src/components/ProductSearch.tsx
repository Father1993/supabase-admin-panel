'use client'

import { useState, useEffect, useRef } from 'react'
import { Row } from '@/types/products'
import { ProductSearchProps } from '@/types/main'

export function ProductSearch({
  onSelectProduct,
  selectedProduct,
  searchProducts,
}: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Row[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.product_name || `ID: ${selectedProduct.id}`)
      setIsOpen(false)
    }
  }, [selectedProduct])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const products = await searchProducts(value.trim())
      setResults(products)
      setIsOpen(products.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setIsOpen(false)
    }
    setLoading(false)
  }

  const handleSelectProduct = (product: Row) => {
    onSelectProduct(product)
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onSelectProduct(null)
  }

  return (
    <div className='relative' ref={searchRef}>
      <div className='relative'>
        <input
          type='text'
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() =>
            query.length >= 2 && results.length > 0 && setIsOpen(true)
          }
          placeholder='Поиск по названию, ID или коду 1С...'
          className='w-full px-4 py-3 pl-12 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white'
        />
        <svg
          className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='11' cy='11' r='8'></circle>
          <path d='m21 21-4.35-4.35'></path>
        </svg>
        {(query || selectedProduct) && (
          <button
            onClick={handleClear}
            className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </svg>
          </button>
        )}
        {loading && (
          <div className='absolute right-12 top-1/2 transform -translate-y-1/2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto'>
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className='w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 focus:bg-slate-50 focus:outline-none'
            >
              <div className='font-medium text-slate-900'>
                {product.product_name || 'Без названия'}
              </div>
              <div className='text-sm text-slate-500 flex gap-4 mt-1'>
                <span>ID: {product.id}</span>
                {product.article && <span>Артикул: {product.article}</span>}
                {product.code_1c && <span>Код 1С: {product.code_1c}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

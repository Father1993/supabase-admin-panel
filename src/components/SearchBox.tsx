'use client'
import { useState, useEffect, useRef } from 'react'

type Item = { id: number }

type Props<T extends Item> = {
  onSelect: (item: T | null) => void
  selected: T | null
  search: (query: string) => Promise<T[]>
  placeholder: string
  renderItem: (item: T) => { title: string; subtitle: string }
  getDisplayText?: (item: T) => string
}

export function SearchBox<T extends Item>({
  onSelect,
  selected,
  search,
  placeholder,
  renderItem,
  getDisplayText,
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected && getDisplayText) {
      setQuery(getDisplayText(selected))
      setIsOpen(false)
    }
  }, [selected, getDisplayText])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
      const items = await search(value.trim())
      setResults(items)
      setIsOpen(items.length > 0)
    } catch {
      setResults([])
      setIsOpen(false)
    }
    setLoading(false)
  }

  return (
    <div className='relative' ref={ref}>
      <div className='relative'>
        <input
          type='text'
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() =>
            query.length >= 2 && results.length > 0 && setIsOpen(true)
          }
          placeholder={placeholder}
          className='w-full px-4 py-3 pl-12 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white'
        />
        <svg
          className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
          width='20'
          height='20'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='11' cy='11' r='8' />
          <path d='m21 21-4.35-4.35' />
        </svg>
        {(query || selected) && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              onSelect(null)
            }}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
          >
            <svg
              width='16'
              height='16'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        )}
        {loading && (
          <div className='absolute right-12 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-y-auto'>
          {results.map((item) => {
            const { title, subtitle } = renderItem(item)
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item)
                  setIsOpen(false)
                }}
                className='w-full px-4 py-3 text-left hover:bg-slate-50 border-b last:border-b-0'
              >
                <div className='font-medium text-slate-900'>{title}</div>
                <div className='text-sm text-slate-500 mt-1'>{subtitle}</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
